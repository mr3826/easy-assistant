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
            <p className="mt-2 text-sm text-gray-500">MVP privacy notice for the Easy Assistant pilot.</p>
          </div>

          <p>
            Easy Assistant collects the account, workspace, and operational data needed to run
            the MVP: name and sign-in details, business profile information, staff and service
            setup, availability, appointments, conversations, reminders, support requests, and
            AI configuration.
          </p>

          <p>
            We use that information to authenticate users, display the dashboard, manage
            bookings, deliver reminders, support WhatsApp conversations, and maintain the
            service. We do not need more data than that to operate the MVP.
          </p>

          <p>
            Customer conversation and booking records should be treated as business-confidential
            information. Access should stay limited to authorized account holders and service
            providers that are required to run the product.
          </p>

          <p>
            We keep data only as long as it is needed for the account, the booked work, legal
            obligations, dispute handling, or reasonable operational retention. Backups and logs
            should follow the same minimum-retention approach in production.
          </p>

          <p>
            AI-generated replies and suggestions can be wrong, incomplete, or outdated. Review
            them before sending them to customers, and do not rely on them for final decisions
            where human judgment is required.
          </p>

          <p>
            For privacy questions, deletion requests, or account support, use the in-app support
            path or contact the workspace owner. Response times during the MVP may be limited.
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
