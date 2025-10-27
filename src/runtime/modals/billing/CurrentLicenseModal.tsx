import {
  Action,
  ActionStyleTypes,
  Badge,
  type EverythingAsCode,
  type EverythingAsCodeLicensing,
  JSX,
  LicenseCard,
  LoadingIcon,
  Modal,
  ToggleCheckbox,
  useEffect,
  useState,
  WorkspaceManager,
} from '../../../.deps.ts';
import { loadStripe } from 'npm:@stripe/stripe-js@7.8.0';

export const IsIsland = true;
export type CurrentLicenseModalProps = {
  eac: EverythingAsCode & EverythingAsCodeLicensing;
  workspaceMgr: WorkspaceManager;
  onClose: () => void;
};

type LicensePlan = {
  Amount: number;
  Description?: string;
  Features?: string[];
  Featured?: boolean;
  Highlight?: string | boolean;
  Interval: 'month' | 'year';
  Lookup: string;
  Name: string;
  PlanLookup: string;
};

const heroAccent = 'from-neon-violet-500/80 via-sky-500/70 to-cyan-400/80';
const intervalAccent = 'from-sky-500/70 via-indigo-500/70 to-violet-500/70';
const plansAccent = 'from-fuchsia-500/70 via-violet-500/70 to-sky-500/70';
const checkoutAccent = 'from-emerald-500/70 via-sky-500/70 to-cyan-400/70';
const infoAccent = 'from-amber-400/70 via-orange-500/70 to-pink-500/70';

const CardAccent = ({ gradient }: { gradient: string }): JSX.Element => (
  <div
    class={['pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r', gradient].join(
      ' ',
    )}
  />
);

const formatAmount = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  const formatted = value % 1 === 0
    ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$${formatted}`;
};

export function CurrentLicenseModal({
  eac,
  workspaceMgr,
  onClose,
}: CurrentLicenseModalProps): JSX.Element {
  const {
    license,
    licLookup,
    stripePublishableKey,
    isMonthly,
    activePlan,
    clientSecret,
    error: hookError,
    licenseLoading,
    activateMonthly,
    activatePlan,
    setActivePlan,
  } = workspaceMgr.UseLicenses(eac);

  const [submit, setSubmit] = useState<
    ((e: SubmitEvent) => void) | undefined
  >();
  const [payError, setPayError] = useState('');

  const plans: LicensePlan[] = license
    ? Object.keys(license.Plans)
      .map((planLookup) => {
        const plan = license.Plans[planLookup];

        return Object.keys(plan.Prices).map((priceLookup) => {
          const price = plan.Prices[priceLookup];

          return {
            Lookup: `${planLookup}-${price.Details!.Interval}`,
            PlanLookup: planLookup,
            Name: plan.Details!.Name ?? planLookup,
            Description: plan.Details!.Description ?? '',
            Amount: Number(price.Details?.Value ?? 0),
            Interval: price.Details!.Interval as 'month' | 'year',
            Featured: !!plan.Details!.Featured,
            Highlight: plan.Details!.Featured,
            Features: plan.Details!.Features,
          } satisfies LicensePlan;
        });
      })
      .flat()
    : [];

  const interval = isMonthly ? 'month' : 'year';
  const intervalPlans = plans.filter((p) => p.Interval === interval);
  const activePlanDetails =
    plans.find((p) => p.PlanLookup === activePlan && p.Interval === interval) ??
      plans.find((p) => p.PlanLookup === activePlan);
  const spotlightPlan = activePlanDetails ??
    intervalPlans.find((p) => p.Featured) ??
    intervalPlans[0];

  useEffect(() => {
    if (!clientSecret || !stripePublishableKey) return;

    const configure = async () => {
      const stripe = await loadStripe(stripePublishableKey);

      const elements = stripe!.elements({
        clientSecret,
        appearance: {},
      });

      const paymentElement = elements.create('payment');

      paymentElement.mount('#payment-element');

      const returnUrl = new URL(location.pathname, location.origin);

      setSubmit(() => async (e: SubmitEvent) => {
        e.preventDefault();

        const { error } = await stripe!.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl.toString(),
          },
        });

        if (error) {
          setPayError(error.message ?? '');
        }
      });
    };

    configure();
  }, [clientSecret, stripePublishableKey]);

  if (!license || !licLookup) {
    return (
      <Modal title='Current License' onClose={onClose}>
        <div class='p-10 text-center text-sm text-slate-300'>Loading...</div>
      </Modal>
    );
  }

  return (
    <Modal title='Current License' onClose={onClose}>
      <div class='space-y-6 text-sm text-slate-200'>
        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 p-6 shadow-xl'>
          <CardAccent gradient={`${heroAccent} opacity-80`} />
          <div class='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
            <div class='max-w-xl space-y-3'>
              <p class='text-xs font-semibold uppercase tracking-wide text-sky-300/90'>
                Workspace licensing
              </p>
              <h3 class='text-2xl font-semibold text-white md:text-3xl'>
                Scale access without leaving the flow
              </h3>
              <p class='text-sm leading-relaxed text-slate-300'>
                Toggle between monthly and annual billing, compare plans, and confirm payment in one
                modern experience. Pricing updates apply instantly to your active workspace.
              </p>
            </div>
            {spotlightPlan && (
              <div class='relative rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-4 text-xs text-sky-100 shadow-lg md:max-w-xs'>
                <p class='font-semibold uppercase tracking-wide text-sky-200'>
                  {activePlan ? 'Active plan snapshot' : 'Recommended focus'}
                </p>
                <div class='mt-2 space-y-1 text-sky-100/90'>
                  <p class='text-lg font-semibold text-white'>{spotlightPlan.Name}</p>
                  <p class='text-sm text-sky-100/80'>
                    {formatAmount(spotlightPlan.Amount)} / {spotlightPlan.Interval}
                  </p>
                  {spotlightPlan.Features && spotlightPlan.Features.length > 0 && (
                    <div class='mt-3 space-y-1 text-xs text-sky-100/80'>
                      {spotlightPlan.Features.slice(0, 3).map((feature) => (
                        <p key={feature}>N/A {feature}</p>
                      ))}
                      {spotlightPlan.Features.length > 3 && <p>N/A and moreN/A</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-6 shadow-xl'>
          <CardAccent gradient={`${intervalAccent} opacity-80`} />
          <div class='flex flex-col items-center gap-4 text-center'>
            <div class='space-y-1'>
              <h3 class='text-lg font-semibold text-white'>Billing cadence</h3>
              <p class='text-sm text-slate-400'>
                Switch between monthly and yearly pricing. Yearly plans often bundle additional
                savings and include enterprise support.
              </p>
            </div>
            <div class='flex items-center gap-3 rounded-full border border-slate-700/60 bg-neutral-950/50 px-4 py-2'>
              <span
                class={`text-xs font-semibold uppercase tracking-wide ${
                  isMonthly ? 'text-sky-200' : 'text-slate-500'
                }`}
              >
                Monthly
              </span>
              <ToggleCheckbox
                checked={!isMonthly}
                onToggle={() => activateMonthly()}
                title='Toggle billing interval'
              />
              <span
                class={`text-xs font-semibold uppercase tracking-wide ${
                  !isMonthly ? 'text-sky-200' : 'text-slate-500'
                }`}
              >
                Yearly
              </span>
            </div>
            {activePlan && (
              <Action
                styleType={ActionStyleTypes.Link | ActionStyleTypes.Rounded}
                onClick={() => setActivePlan(undefined)}
              >
                Change selected plan
              </Action>
            )}
            <div class='flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500'>
              <Badge class='uppercase tracking-wide text-slate-300'>
                Viewing {isMonthly ? 'monthly' : 'yearly'} prices
              </Badge>
              <span>All prices in USD unless noted otherwise.</span>
            </div>
          </div>
        </section>

        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/80 p-6 shadow-xl'>
          <CardAccent gradient={`${plansAccent} opacity-80`} />
          <div class='space-y-1'>
            <h3 class='text-lg font-semibold text-white'>
              {activePlan ? 'Selected plan' : 'Available plans'}
            </h3>
            <p class='text-sm text-slate-400'>
              {activePlan
                ? `You're about to activate ${
                  activePlanDetails?.Name ?? 'this plan'
                }. Review what's included, then confirm payment below.`
                : 'Choose a plan that matches your workspace workload. Featured plans include extra automation and telemetry capabilities.'}
            </p>
          </div>

          {licenseLoading && !clientSecret
            ? (
              <div class='mt-8 flex justify-center py-10'>
                <LoadingIcon class='inline-block h-16 w-16 animate-spin text-neon-violet-500' />
              </div>
            )
            : intervalPlans.length === 0
            ? (
              <div class='mt-6 rounded-2xl border border-dashed border-slate-700/60 bg-neutral-950/40 p-6 text-center text-slate-400'>
                No plans available for this billing interval yet. Try switching cadence or check
                back soon.
              </div>
            )
            : activePlan && activePlanDetails
            ? (
              <div class='mt-6 flex justify-center'>
                <LicenseCard
                  key={activePlanDetails.Lookup}
                  class='w-full max-w-3xl scale-[1.02]'
                  name={activePlanDetails.Name}
                  licenseLoading={licenseLoading}
                  description={activePlanDetails.Description}
                  amount={activePlanDetails.Amount}
                  interval={activePlanDetails.Interval}
                  features={activePlanDetails.Features}
                  featured={activePlanDetails.Featured}
                  highlightLabel={typeof activePlanDetails.Highlight === 'string'
                    ? activePlanDetails.Highlight
                    : undefined}
                  isActive
                />
              </div>
            )
            : (
              <div class='mt-6 grid gap-6 md:grid-cols-2'>
                {intervalPlans.map((plan) => (
                  <LicenseCard
                    key={plan.Lookup}
                    name={plan.Name}
                    licenseLoading={licenseLoading}
                    description={plan.Description}
                    amount={plan.Amount}
                    interval={plan.Interval}
                    features={plan.Features}
                    featured={plan.Featured}
                    highlightLabel={typeof plan.Highlight === 'string' ? plan.Highlight : undefined}
                    isActive={activePlan === plan.PlanLookup}
                    onSelect={() => activatePlan(plan.PlanLookup, isMonthly)}
                  />
                ))}
              </div>
            )}
        </section>

        {activePlan && clientSecret && (
          <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/85 p-6 shadow-xl'>
            <CardAccent gradient={`${checkoutAccent} opacity-80`} />
            <div class='space-y-2'>
              <h3 class='text-lg font-semibold text-white'>Secure checkout</h3>
              <p class='text-sm text-slate-400'>
                Payments are processed by Stripe. Confirm payment details below to activate{' '}
                {activePlanDetails?.Name ?? 'your selected plan'}.
              </p>
            </div>

            <form id='payment-form' onSubmit={(e) => submit?.(e)} class='mt-6 space-y-4'>
              <div
                id='payment-element'
                class='rounded-xl border border-slate-700/60 bg-neutral-950/70 px-4 py-5'
              >
              </div>

              {!licenseLoading
                ? (
                  <div class='flex flex-wrap items-center justify-between gap-3'>
                    <Action id='submit' type='submit' class='w-full md:w-auto'>
                      Subscribe
                    </Action>
                    <p class='text-xs text-slate-500'>
                      You will receive an emailed receipt after payment succeeds.
                    </p>
                  </div>
                )
                : (
                  <div class='flex justify-center py-4'>
                    <LoadingIcon class='inline-block h-12 w-12 animate-spin text-neon-blue-500' />
                  </div>
                )}

              {(hookError || payError) && (
                <div class='rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200'>
                  {hookError || payError}
                </div>
              )}
            </form>
          </section>
        )}

        <section class='relative overflow-hidden rounded-3xl border border-slate-700/60 bg-neutral-900/70 p-6 shadow-inner'>
          <CardAccent gradient={`${infoAccent} opacity-80`} />
          <div class='grid gap-4 md:grid-cols-2'>
            <div class='rounded-2xl border border-neutral-800/60 bg-neutral-950/40 p-4'>
              <p class='text-sm font-semibold text-white'>Need help choosing?</p>
              <p class='mt-2 text-xs text-slate-400'>
                Email{' '}
                <a class='underline text-sky-300' href='mailto:support@openindustrial.co'>
                  support@openindustrial.co
                </a>{' '}
                with your workspace goals and we will recommend the right plan.
              </p>
            </div>
            <div class='rounded-2xl border border-neutral-800/60 bg-neutral-950/40 p-4'>
              <p class='text-sm font-semibold text-white'>License updates</p>
              <p class='mt-2 text-xs text-slate-400'>
                Plan changes take effect immediately. Cancel any time before renewal to stop future
                charges.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

CurrentLicenseModal.Modal = (
  eac: EverythingAsCode & EverythingAsCodeLicensing,
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
          <CurrentLicenseModal
            eac={eac}
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

export default CurrentLicenseModal;
