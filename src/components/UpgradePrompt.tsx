import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Infinity as InfinityIcon, Clock } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: () => void;
  limit: number;
}

export const UpgradePrompt = ({ open, onOpenChange, onSignIn, limit }: UpgradePromptProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/40">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl btn-gradient-primary shadow-glow-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Daily free limit reached
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            You've used all {limit} free debugs today. Sign in to unlock unlimited queries and keep your full history synced across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5 py-3">
          <Feature icon={<InfinityIcon className="h-3.5 w-3.5" />} text="Unlimited daily debugs" />
          <Feature icon={<Zap className="h-3.5 w-3.5" />} text="Faster responses & deep analysis" />
          <Feature icon={<Clock className="h-3.5 w-3.5" />} text="Synced history across all devices" />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
          <Button
            className="rounded-full btn-gradient-primary text-primary-foreground shadow-glow-sm font-semibold"
            onClick={onSignIn}
          >
            Sign in for unlimited
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Feature = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2.5 text-[13px] text-foreground/85">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    {text}
  </div>
);
