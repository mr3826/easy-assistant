import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach } from 'vitest';

const mountedRoots: Array<{ container: HTMLDivElement; root: Root }> = [];

export function render(ui: ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let root: Root | undefined;
  act(() => {
    root = createRoot(container);
    root.render(ui);
  });

  if (!root) {
    throw new Error('React root was not created.');
  }

  mountedRoots.push({ container, root });
  return { container };
}

export function click(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

export function typeInto(element: HTMLInputElement, value: string) {
  act(() => {
    element.focus();
    element.value = value;
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

export async function waitFor(assertion: () => void, timeout = 1000) {
  const deadline = Date.now() + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }

  throw lastError;
}

export function getByTestId(container: ParentNode, testId: string) {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Unable to find element with data-testid="${testId}".`);
  }
  return element;
}

export function getByText(container: ParentNode, text: string) {
  const element = Array.from(container.querySelectorAll('*')).find(
    (candidate) => candidate.textContent === text,
  );

  if (!element) {
    throw new Error(`Unable to find element with text "${text}".`);
  }

  return element;
}

export function queryByText(container: ParentNode, text: string) {
  return Array.from(container.querySelectorAll('*')).find(
    (candidate) => candidate.textContent === text,
  );
}

afterEach(() => {
  for (const { container, root } of mountedRoots.splice(0)) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
});
