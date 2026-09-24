import { money, pluralise } from "../lib/format";
import { useSettings } from "../lib/queries";
import { useRunCenter } from "../state/RunCenter";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Modal } from "./ui/Modal";

/**
 * The backend answers a spending call with a plan instead of starting it.
 * Nothing is generated until this dialog is confirmed, which re-sends the same
 * call with `{confirmed: true}`.
 */
export function CostModal() {
  const { pendingCost, confirming, confirmCost, cancelCost } = useRunCenter();
  const { data: settings } = useSettings();
  const images = pendingCost?.plannedImages ?? null;
  const cost = pendingCost?.estimatedCostUsd ?? null;
  const model = settings?.image_model ?? null;

  return (
    <Modal
      open={Boolean(pendingCost)}
      onClose={cancelCost}
      eyebrow="This call spends money"
      title={pendingCost?.label ?? "Confirm"}
      dismissible={!confirming}
      footer={
        <>
          <Button variant="ghost" onClick={cancelCost} disabled={confirming}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void confirmCost()} loading={confirming} icon="spark">
            {images != null ? `Generate ${pluralise(images, "image")}` : "Start the run"}
            {cost != null ? ` — ${money(cost)}` : ""}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Figure label="Images planned" value={images != null ? String(images) : "—"} icon="image" />
        <Figure label="Estimated cost" value={money(cost)} icon="coin" tone="ember" />
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-paper-dim">
        Nothing has been generated yet. The harness returned this plan instead of running it. Confirm and the same
        request is sent again with <code className="rounded border border-line bg-ink-800 px-1 py-px font-mono text-[11.5px] text-ember">confirmed: true</code>, which
        starts the run.
      </p>
      {model ? (
        <p className="mt-3 border-t border-line pt-3 font-mono text-[11.5px] text-paper-faint">
          {Object.entries(model)
            .filter(([, value]) => typeof value === "string" || typeof value === "number")
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join("   ")}
        </p>
      ) : null}
    </Modal>
  );
}

function Figure({
  label,
  value,
  icon,
  tone = "paper",
}: {
  label: string;
  value: string;
  icon: "image" | "coin";
  tone?: "paper" | "ember";
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-900 px-3.5 py-3">
      <div className="micro flex items-center gap-1.5 text-paper-faint">
        <Icon name={icon} size={13} />
        {label}
      </div>
      <div className={`mt-2 font-mono text-[26px] leading-none ${tone === "ember" ? "text-ember" : "text-paper"}`}>
        {value}
      </div>
    </div>
  );
}
