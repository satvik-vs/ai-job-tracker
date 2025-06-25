import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log(`🔥 N8N Trigger called: ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`❌ Method not allowed: ${req.method}`)
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed. Use POST.` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    )
  }

  try {
    console.log('📥 Processing POST request...')
    
    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📋 Request body parsed:', JSON.stringify(requestBody, null, 2))
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', success: false }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { 
      type, 
      user_id, 
      user_email, 
      request_id, 
      data 
    } = requestBody

    console.log('🚀 Triggering N8N workflow:', { type, user_id, request_id })

    // Validate required fields
    if (!type || !user_id || !request_id || !data) {
      const missingFields = []
      if (!type) missingFields.push('type')
      if (!user_id) missingFields.push('user_id')
      if (!request_id) missingFields.push('request_id')
      if (!data) missingFields.push('data')
      
      console.error('❌ Missing required fields:', missingFields)
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Prepare payload for N8N Railway - EXACTLY matching your workflow structure
    const n8nPayload = {
      type,
      user_id,
      user_email: user_email || '',
      request_id,
      timestamp: new Date().toISOString(),
      data: {
        company_name: data.company_name || '',
        job_title: data.job_title || '',
        job_description: data.job_description || '',
        selected_job_id: data.selected_job_id || null,
        // Cover letter specific fields
        hiring_manager: data.hiring_manager || '',
        tone: data.tone || 'professional',
        personal_experience: data.personal_experience || '',
        why_company: data.why_company || ''
      }
    }

    console.log('📤 Sending to N8N Railway:', JSON.stringify(n8nPayload, null, 2))

    // Send to N8N Railway webhook with proper headers
    const n8nResponse = await fetch('https://primary-production-130e0.up.railway.app/webhook/job-application-received', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
        'Accept': 'application/json',
        'X-Request-Source': 'supabase-edge-function',
        'X-Railway-Domain': 'primary-production-130e0.up.railway.app'
      },
      body: JSON.stringify(n8nPayload)
    })

    console.log('📊 N8N Response Status:', n8nResponse.status)
    console.log('📊 N8N Response Headers:', Object.fromEntries(n8nResponse.headers.entries()))

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => 'Unknown error')
      console.error('❌ N8N Error Response:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`,
          details: errorText,
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const responseData = await n8nResponse.text().catch(() => 'OK')
    console.log('✅ N8N webhook triggered successfully:', responseData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'N8N workflow triggered successfully',
        request_id,
        n8n_response: responseData,
        payload_sent: n8nPayload
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error triggering N8N workflow:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: error.stack,
        type: 'internal_error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})