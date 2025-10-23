import type { FunctionalComponent, JSX } from 'npm:preact@10.20.1';
import { Action, ActionStyleTypes, useEffect, useRef } from '../../../.deps.ts';

interface SurfaceWarmQueryModalQueryProps {
  query: string;
  onQueryChange: (name: string) => void;
  onQueryBlur?: (value: string) => void;
  historyIndex?: number;
  historyLength?: number;
  onHistoryNavigate?: (direction: 'first' | 'prev' | 'next' | 'last') => void;
  errors: string;
  isLoading?: boolean;
}

export const SurfaceWarmQueryModalQuery: FunctionalComponent<SurfaceWarmQueryModalQueryProps> = ({
  query,
  onQueryChange,
  onQueryBlur,
  historyIndex,
  historyLength,
  onHistoryNavigate,
  errors,
  isLoading = false,
}) => {
  type InputLike = HTMLInputElement | HTMLTextAreaElement;
  type InputEvt = JSX.TargetedInputEvent<InputLike>;

  const Icon = ({ children }: { children: JSX.Element | JSX.Element[] }) => (
    <svg
      class='w-6 h-6 text-neon-yellow-500 dark:text-neon-yellow-300'
      viewBox='0 0 24 24'
      fill='currentColor'
    >
      {children}
    </svg>
  );

  const handleQueryChange = (e: string | InputEvt) => {
    const inputValue = typeof e === 'string' ? e : e.currentTarget.value;
    onQueryChange(inputValue);
  };

  const historyEnabled = typeof onHistoryNavigate === 'function';
  const safeLength = Math.max(0, historyLength ?? 0);
  const safeIndex = typeof historyIndex === 'number'
    ? historyIndex
    : (safeLength > 0 ? safeLength - 1 : -1);
  const showHistoryControls = safeLength > 1;
  const canGoBackward = historyEnabled && safeIndex > 0;
  const canGoForward = historyEnabled && safeIndex >= 0 && safeIndex < safeLength - 1;
  const safeDisplayIndex = safeIndex >= 0 ? safeIndex + 1 : 0;
  const displayIndex = Math.max(safeDisplayIndex, 1);
  const displayTotal = Math.max(safeLength, 1);

  type HistoryDirection = 'first' | 'prev' | 'next' | 'last';

  const HistoryIcon = ({ direction }: { direction: HistoryDirection }) => {
    const baseProps = {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      class: 'h-4 w-4',
    };
    if (direction === 'first') {
      return (
        <svg {...baseProps}>
          <path d='M9.78 5.22a.75.75 0 0 0-1.06 0L3.47 10.47a.75.75 0 0 0 0 1.06l5.25 5.25a.75.75 0 0 0 1.06-1.06L5.06 11l4.72-4.72a.75.75 0 0 0 0-1.06z' />
          <path d='M16.28 5.22a.75.75 0 0 0-1.06 0L9.97 10.47a.75.75 0 0 0 0 1.06l5.25 5.25a.75.75 0 1 0 1.06-1.06L11.56 11l4.72-4.72a.75.75 0 0 0 0-1.06z' />
        </svg>
      );
    }
    if (direction === 'prev') {
      return (
        <svg {...baseProps}>
          <path d='M12.78 5.22a.75.75 0 0 0-1.06 0L6.47 10.47a.75.75 0 0 0 0 1.06l5.25 5.25a.75.75 0 1 0 1.06-1.06L8.56 11l4.72-4.72a.75.75 0 0 0 0-1.06z' />
        </svg>
      );
    }
    if (direction === 'next') {
      return (
        <svg {...baseProps}>
          <path d='M7.22 5.22a.75.75 0 0 1 1.06 0L13.53 10.47a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L11.44 11 7.22 6.78a.75.75 0 0 1 0-1.56z' />
        </svg>
      );
    }
    return (
      <svg {...baseProps}>
        <path d='M3.72 5.22a.75.75 0 0 1 1.06 0L10.03 10.47a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06-1.06L8.44 11 3.72 6.28a.75.75 0 0 1 0-1.06z' />
        <path d='M10.22 5.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06-1.06L14.44 11l-4.72-4.72a.75.75 0 0 1 0-1.06z' />
      </svg>
    );
  };

  const handleNavigate = (direction: HistoryDirection) => {
    onHistoryNavigate?.(direction);
  };

  const positionLabel = `Showing draft query ${displayIndex} of ${displayTotal} (revisions available to this modal instance ONLY)`;

  const hasErrors = !!errors && errors.trim().length > 0;

  // Keep the console scrolled to the latest line as errors append
  const consoleRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const el = consoleRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [errors, isLoading]);

  const ConsoleContent = () => {
    // While loading: show the working line and put the blinking underscore at the end.
    if (isLoading) {
      return (
        <>
          {hasErrors ? errors : '> Executing Query...'} <span class='animate-caret'>_</span>
        </>
      );
    }

    // Not loading + have errors: show errors, then a new prompt line after it.
    if (hasErrors) {
      return (
        <>
          {errors}
          {'\n> '}
          <span class='animate-caret'>_</span>
        </>
      );
    }

    // Idle + no errors: show a single prompt on the FIRST line.
    return (
      <>
        {'> '}
        <span class='animate-caret'>_</span>
      </>
    );
  };

  return (
    <>
      {/* Only the underscore blinks (not the ">") */}
      <style>
        {`
        @keyframes crt-blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
        .animate-caret { animation: crt-blink 1s steps(1) infinite; color: #39ff14; text-shadow: 0 0 6px rgba(57,255,20,.75); }
      `}
      </style>

      <div class='h-full flex flex-col min-h-0 pl-6 pr-6 pt-6 pb-0 rounded-sm'>
        <label class='flex items-center gap-2 text-neutral-900 dark:text-white font-semibold mb-2'>
          <Icon>
            <path d='M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.51 4.51 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.5 6.5 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.22 3.22 0 0 0 20 7c0-2.21-3.58-4-8-4' />
          </Icon>
          Query <small class='text-gray-500'>Maximum 5000 characters.</small>
        </label>

        <textarea
          id='query'
          name='query'
          value={query}
          onInput={(e) => handleQueryChange(e)}
          onBlur={(e) => onQueryBlur?.(e.currentTarget.value)}
          required
          maxLength={5000}
          placeholder='Query (max 5000)'
          class='text-xs w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 p-4 rounded-sm border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neon-blue-500 resize-none invalid:border-red-500 invalid:focus:ring-red-500'
          style={{ height: '190px' }}
        />

        {showHistoryControls && (
          <div class='mt-3 flex items-center justify-between text-xs text-neutral-400'>
            <span class='italic'>{positionLabel}</span>
            <div class='flex items-center gap-2'>
              <Action
                type='button'
                styleType={ActionStyleTypes.Icon}
                onClick={() => handleNavigate('first')}
                disabled={!canGoBackward}
                title='First query'
              >
                <HistoryIcon direction='first' />
              </Action>
              <Action
                type='button'
                styleType={ActionStyleTypes.Icon}
                onClick={() => handleNavigate('prev')}
                disabled={!canGoBackward}
                title='Previous query'
              >
                <HistoryIcon direction='prev' />
              </Action>
              <Action
                type='button'
                styleType={ActionStyleTypes.Icon}
                onClick={() => handleNavigate('next')}
                disabled={!canGoForward}
                title='Next query'
              >
                <HistoryIcon direction='next' />
              </Action>
              <Action
                type='button'
                styleType={ActionStyleTypes.Icon}
                onClick={() => handleNavigate('last')}
                disabled={!canGoForward}
                title='Most recent query'
              >
                <HistoryIcon direction='last' />
              </Action>
            </div>
          </div>
        )}

        {/* Console label */}
        <div class='mt-4 flex items-center gap-2 mb-2'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            class='text-green-500'
          >
            <path
              fill='currentColor'
              d='M20 19V7H4v12zm0-16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-7 14v-2h5v2zm-3.42-4L5.57 9H8.4l3.3 3.3c.39.39.39 1.03 0 1.42L8.42 17H5.59z'
            />
          </svg>
          <strong>Console</strong>
        </div>

        {/* CRT-style console */}
        <div class='relative'>
          <pre
            ref={consoleRef}
            class='w-full overflow-auto font-mono text-xs leading-4 tracking-wide
                    border rounded-sm p-3 whitespace-pre-wrap break-words
                    selection:bg-green-700/30'
            style={{
              height: '130px',
              lineHeight: 1.5,
              color: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(4, 0, 0, 0.9)',
              borderColor: 'rgba(200, 15, 20, 0.26)',
              textShadow: 'rgba(255, 15, 20, 0.65) 0px 0px 8px',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              boxShadow: 'inset 0 0 10px rgba(57,255,20,.25)',
            }}
          >
            <ConsoleContent />
          </pre>

          {/* scanline overlay */}
          <div
            aria-hidden='true'
            class='pointer-events-none absolute inset-0 mix-blend-screen opacity-35'
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(57,255,20,.08), rgba(57,255,20,.08) 1px, transparent 2px, transparent 4px)',
            }}
          />
        </div>
      </div>
    </>
  );
};
