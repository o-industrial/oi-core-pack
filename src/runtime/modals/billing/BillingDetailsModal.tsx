import {
  Action,
  ActionStyleTypes,
  JSX,
  Modal,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';

export type BillingDetailsModalProps = {
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

export function BillingDetailsModal({
  workspaceMgr,
  onClose,
}: BillingDetailsModalProps): JSX.Element {
  void workspaceMgr;

  return (
    <Modal title='Billing Details' onClose={onClose}>
      <div class='space-y-6 text-sm'>
        {/* Subscription Summary */}
        <section>
          <h3 class='text-lg font-semibold mb-2'>Subscription Summary</h3>
          <p>
            Plan: <strong>Basic (placeholder)</strong>
          </p>
          <p>Renewal Date: 2025-01-01</p>
          <p>Price: $0/mo</p>
          <p>Status: Active</p>
        </section>

        {/* Billing History */}
        <section>
          <h3 class='text-lg font-semibold mb-2'>Billing History</h3>
          <table class='w-full text-left border-collapse'>
            <thead>
              <tr class='border-b border-neutral-700'>
                <th class='p-2'>Date</th>
                <th class='p-2'>Description</th>
                <th class='p-2'>Amount</th>
                <th class='p-2'>Status</th>
                <th class='p-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class='border-b border-neutral-800'>
                <td class='p-2'>2024-01-01</td>
                <td class='p-2'>Starter Plan</td>
                <td class='p-2'>$0.00</td>
                <td class='p-2'>Paid</td>
                <td class='p-2 space-x-2'>
                  <Action styleType={ActionStyleTypes.Link} onClick={() => {}}>
                    View Invoice
                  </Action>
                  <Action styleType={ActionStyleTypes.Link} onClick={() => {}}>
                    Download Receipt
                  </Action>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      {/* TODO: integrate OpenIndustrialAPIClient.Billing.GetHistory() for real data */}
    </Modal>
  );
}

BillingDetailsModal.Modal = (
  workspaceMgr: WorkspaceManager,
): {
  Modal: JSX.Element;
  Hide: () => void;
  IsOpen: () => boolean;
  Show: () => void;
} => {
  const [shown, setShow] = useState(false);

  return {
    Modal: (
      <>
        {shown && (
          <BillingDetailsModal
            workspaceMgr={workspaceMgr}
            onClose={() => setShow(false)}
          />
        )}
      </>
    ),
    Hide: () => setShow(false),
    IsOpen: () => shown,
    Show: () => setShow(true),
  };
};

export default BillingDetailsModal;
