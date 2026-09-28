import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";

export default function ProvidersSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Providers" />
      <SettingsNav />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-md flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6">
          <KeyRound
            className="size-5 text-muted-foreground"
            strokeWidth={1.75}
          />
          <div>
            <div className="font-heading text-[13px] font-extrabold tracking-tight">
              Pas de config provider ici
            </div>
            <p className="mt-1 font-mono text-[12px] leading-relaxed text-muted-foreground">
              Les agents s&apos;exécutent via le CLI <code>claude</code>{" "}
              (voir Settings → Système), qui gère lui-même son
              authentification. Ce dashboard n&apos;a pas de couche
              provider/clé API à part — cette page apparaîtra dès qu&apos;il y
              en aura une réelle à configurer.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
