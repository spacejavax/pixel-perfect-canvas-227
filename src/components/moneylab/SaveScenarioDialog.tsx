import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { saveScenario } from "@/lib/money-lab";
import type { Json } from "@/integrations/supabase/types";

export function SaveScenarioDialog({
  toolSlug,
  defaultTitle,
  inputData,
  resultData,
  disabled,
}: {
  toolSlug: string;
  defaultTitle: string;
  inputData: Json;
  resultData: Json;
  disabled?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!user) return;
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Ge scenariot ett namn.");
      return;
    }
    setSaving(true);
    try {
      await saveScenario({ userId: user.id, toolSlug, title: trimmed, inputData, resultData });
      await queryClient.invalidateQueries({ queryKey: ["money-lab-scenarios"] });
      toast.success("Scenariot är sparat.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte spara scenariot.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setTitle(defaultTitle);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Spara scenario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Spara scenario</DialogTitle>
          <DialogDescription>
            Spara dina värden så att du kan öppna beräkningen igen senare.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-2">
            <Label htmlFor="scenario-title">Namn</Label>
            <Input
              id="scenario-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Du behöver vara inloggad för att spara scenarier.{" "}
            <Link to="/logga-in" className="font-medium underline">
              Logga in
            </Link>
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={!user || saving}>
            {saving ? "Sparar…" : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}