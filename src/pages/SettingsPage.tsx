import { useEffect, useState } from "react";
import {
  defaultNotifications,
  defaultStoreSettings,
} from "@/data/analytics";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button, Input, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [store, setStore] = useState(defaultStoreSettings);
  const [profile, setProfile] = useState({
    name: user?.name || "RNB Admin",
    email: user?.email || "admin@rnbcollections.com",
  });
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState(defaultNotifications);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email });
    }
  }, [user]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store, profile, and notifications" />

      <div className="section-card">
        <h3>Store Settings</h3>
        <div className="form-grid">
          <Input label="Store Name" value={store.storeName} onChange={(e) => setStore((p) => ({ ...p, storeName: e.target.value }))} />
          <Input label="Store Email" value={store.storeEmail} onChange={(e) => setStore((p) => ({ ...p, storeEmail: e.target.value }))} />
          <Input label="Phone" value={store.phone} onChange={(e) => setStore((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Currency" value={store.currency} onChange={(e) => setStore((p) => ({ ...p, currency: e.target.value }))} />
          <Input label="Timezone" value={store.timezone} onChange={(e) => setStore((p) => ({ ...p, timezone: e.target.value }))} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Button onClick={() => toast("Store settings saved locally (API coming later)", "success")}>Save Store Settings</Button>
        </div>
      </div>

      <div className="section-card">
        <h3>Admin Profile</h3>
        <div className="form-grid">
          <Input label="Name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} disabled />
          <Input label="Change Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Managed via backend seed for now" />
        </div>
        <div style={{ marginTop: 14 }}>
          <Button onClick={() => { setPassword(""); toast("Profile display updated locally", "success"); }}>
            Save Profile
          </Button>
        </div>
      </div>

      <div className="section-card">
        <h3>Notifications</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(
            [
              ["emailNotifications", "Email Notifications"],
              ["orderNotifications", "Order Notifications"],
              ["lowStockNotifications", "Low Stock Notifications"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="checkbox">
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(e) =>
                  setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Button onClick={() => toast("Notification preferences saved locally", "success")}>
            Save Notifications
          </Button>
        </div>
      </div>
    </div>
  );
}
