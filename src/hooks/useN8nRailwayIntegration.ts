@@ .. @@
     const n8nPayload = {
       type,
       user_id,
-      user_email: user_email || '',
+      user_email: user_email || 'user@example.com',
       request_id,
       timestamp: new Date().toISOString(),
       data: {
-        company_name: data.company_name || '',
-        job_title: data.job_title || '',
-        job_description: data.job_description || '',
+        company_name: data.companyName || '',
+        job_title: data.jobTitle || '',
+        job_description: data.jobDescription || '',
         selected_job_id: data.selected_job_id || null,
         // Cover letter specific
-        hiring_manager: data.hiring_manager || '',
+        hiring_manager: data.hiringManager || '',
         tone: data.tone || 'professional',
-        personal_experience: data.personal_experience || '',
-        why_company: data.why_company || ''
+        personal_experience: data.personalExperience || '',
+        why_company: data.whyCompany || ''
       }
     };
@@ .. @@
     // Send directly to N8N Railway webhook
     const response = await fetch('https://primary-production-130e0.up.railway.app/webhook-test/job-application-received', {
       method: 'POST',
-      headers: {
+      headers: new Headers({
         'Content-Type': 'application/json',
         'User-Agent': 'JobTracker-AI/1.0',
         'Accept': 'application/json',
         'X-Request-Source': 'jobtracker-ai-direct',
         'X-Railway-Domain': 'primary-production-130e0.up.railway.app'
-      },
+      }),
       body: JSON.stringify(payload)
     });