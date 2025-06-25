import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      type, 
      user_id, 
      user_email, 
      request_id, 
      data 
    } = await req.json()

    console.log('🚀 Triggering N8N workflow:', { type, user_id, request_id })

    // Validate required fields
    if (!type || !user_id || !request_id || !data) {
      throw new Error('Missing required fields: type, user_id, request_id, data')
    }

    // Prepare payload for N8N
    const n8nPayload = {
      type,
      user_id,
      user_email,
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

    console.log('📤 Sending to N8N:', n8nPayload)

    // Send to N8N Railway webhook
    const n8nResponse = await fetch('https://primary-production-130e0.up.railway.app/webhook/job-application-received', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobTracker-AI/1.0',
        'X-Request-Source': 'supabase-edge-function',
        'X-Railway-Domain': 'primary-production-130e0.up.railway.app'
      },
      body: JSON.stringify(n8nPayload)
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => 'Unknown error')
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${errorText}`)
    }

    const responseData = await n8nResponse.text().catch(() => 'OK')
    console.log('✅ N8N webhook triggered successfully:', responseData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'N8N workflow triggered successfully',
        request_id,
        n8n_response: responseData
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
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})