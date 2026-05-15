import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — couchHelp',
  description: 'Політика конфіденційності couchHelp',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <div className="space-y-4 text-sm text-slate-700">
          <p>
            <strong>Effective Date:</strong> 15 May 2026
          </p>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">1. Introduction</h2>
          <p>
            couchHelp (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal data when you use our website and services.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">2. Data We Collect</h2>
          <p>
            We collect and process personal data only as necessary to provide our services. This may include:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Account information (email, name) provided during registration</li>
            <li>Usage data and interactions with our AI assistant</li>
            <li>Client-related data you voluntarily enter into the platform</li>
          </ul>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">3. How We Use Your Data</h2>
          <p>
            We use your data solely to operate and improve our coaching assistance platform. We do not sell or share your personal data with third parties for marketing purposes.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, or alteration.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. Contact us at privacy@couchhelp.click for any privacy-related requests.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">6. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
          </p>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@couchhelp.click.
          </p>
        </div>

        <div className="mt-8 border-t pt-6 text-center">
          <Link href="/" className="text-sm font-medium text-teal-700 hover:underline">
            ← Назад на головну
          </Link>
        </div>
      </div>
    </div>
  )
}
