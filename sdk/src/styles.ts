export const STYLE_ID = "onboardflow-styles";

export const CSS = `
.onboardflow-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  pointer-events: auto;
}
.onboardflow-card {
  position: fixed;
  z-index: 2147483001;
  max-width: 360px;
  background: #ffffff;
  color: #0f0f0f;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 12px 32px rgba(0,0,0,0.18);
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  box-sizing: border-box;
}
.onboardflow-card--fade { animation: onboardflow-fade 200ms ease-out; }
.onboardflow-card--slide { animation: onboardflow-slide 220ms ease-out; }
@keyframes onboardflow-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes onboardflow-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.onboardflow-close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  font-size: 16px;
  line-height: 1;
  padding: 2px;
}
.onboardflow-close:hover { color: #111827; }

.onboardflow-title {
  font-weight: 600;
  margin: 0 24px 4px 0;
}
.onboardflow-body {
  color: #374151;
  margin: 0;
  white-space: pre-wrap;
}
.onboardflow-progress {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.onboardflow-progress-dot {
  height: 4px;
  flex: 1;
  border-radius: 999px;
  background: #e5e7eb;
}
.onboardflow-progress-dot--active { background: #6366f1; }

.onboardflow-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.onboardflow-button {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.onboardflow-button--primary { background: #111827; color: #fff; }
.onboardflow-button--secondary { background: #fff; color: #111827; border-color: #d1d5db; }

.onboardflow-checklist { list-style: none; margin: 8px 0 0; padding: 0; }
.onboardflow-checklist-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.onboardflow-checklist-dot { width: 14px; height: 14px; border-radius: 999px; border: 1.5px solid #9ca3af; flex-shrink: 0; }

.onboardflow-highlight {
  position: fixed;
  z-index: 2147482999;
  pointer-events: none;
  border: 2px solid #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,0.15);
  transition: all 150ms ease-out;
}

.onboardflow-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2147483001;
  background: #111827;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
}

.onboardflow-beacon {
  position: fixed;
  z-index: 2147483000;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #6366f1;
  cursor: pointer;
}
.onboardflow-beacon::before {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: 999px;
  background: rgba(99,102,241,0.35);
  animation: onboardflow-pulse 1.6s ease-out infinite;
}
@keyframes onboardflow-pulse {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.8); opacity: 0; }
}
`;

export function ensureStylesInjected(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
