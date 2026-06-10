import { Link } from 'react-router-dom';

export default function LegalPrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Link to="/login" className="text-sm text-blue-600 hover:underline">
          Back to Easy Assistant
        </Link>

        <div className="mt-6 space-y-5 text-gray-700">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500">Placeholder policy for the MVP pilot.</p>
          </div>

          <p>
            Easy Assistant helps local service businesses manage WhatsApp conversations,
            appointments, services, staff, availability, and AI receptionist settings. During
            the MVP, we collect only the account, business, and operational information needed
            to provide and improve those features.
          </p>

          <p>
            Customer conversation and booking data should be handled as business-confidential
            information. Production deployments must use proper access controls, secure storage,
            retention limits, and vendor agreements before processing live customer data.
          </p>

          <p>
            This placeholder will be replaced with a full policy covering data categories,
            purposes, retention, subprocessors, security practices, user rights, and contact
            details before public launch.
          </p>

          <div className="border-t border-gray-200 pt-5 text-sm">
            <Link to="/terms" className="text-blue-600 hover:underline">
              View Terms
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
