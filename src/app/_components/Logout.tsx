import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Button,
} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LogOut, X, ShieldCheck } from "lucide-react";

type Props = {
  /** Optional callback that runs when the user confirms logout */
  onLogout?: () => void;
  /** Optional user display name to show on the card */
  name?: string;
  /** Optional avatar image URL */
  avatarUrl?: string;
};

export default function LogoutPopup({ onLogout, name = "You", avatarUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0 overflow-hidden [&>button]:hidden">
        {/* Animated wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="bg-card rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between py-1.5 px-1">
            <div className="flex items-center gap-1">
              <Avatar className="h-14 w-14">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={`${name} avatar`} />
                ) : (
                  <AvatarFallback>
                    {name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div>
                <h3 className="text-lg font-semibold">Sign out</h3>
                <p className="text-sm ">
                  You're logged in as <span className="font-medium">{name}</span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="py-3 px-2.5">
            <DialogHeader>
              <DialogTitle className="text-xl">Are you sure you want to sign out?</DialogTitle>
              <DialogDescription className="mt-2 text-black">
                Logging out will end your current session. You'll need to log in again to access your account.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Separator />

          <DialogFooter>
            <div className="flex items-center justify-between w-full gap-4 p-4">
              <div className="text-xs ">You can login in again anytime.</div>

              <div className="flex items-center gap-2.5">
                <Button variant="destructive" className="px-2 " onClick={() => setOpen(false)}>
                  Cancel
                </Button>

                <Button
                  className="px-2"
                  onClick={() => {
                    if (onLogout) onLogout();
                    setOpen(false);
                  }}
                >
                  <LogOut className=" h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
