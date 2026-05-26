'use client';

import React, { useState, useEffect } from 'react';
import DashboardWrapper from '@/components/dashboard/DashboardWrapper';
import { 
  Settings, User, Shield, Trash2, 
  Bell, Globe, Mail, Lock, Camera, AlertTriangle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
// Import our secure profile server actions to fetch and update details
import { getUserProfileAction, updateUserProfileAction } from '@/app/actions/auth';

type Tab = 'general' | 'profile' | 'password' | 'delete';

// Define type configuration for profile state parameters
interface UserProfileData {
  email: string;
  full_name: string;
  bio: string;
  avatar: string;
  email_notification: boolean;
  public_profile: boolean;
}

/**
 * DASHBOARD SETTINGS PAGE
 * 
 * Analogy:
 * Think of this like the control dashboard inside a smart home.
 * It houses separate selector panels:
 * - General Settings: Toggling notifications (the doorbell volume) and profile visibility.
 * - Profile Settings: Editing nameplates and uploading dynamic photos (the house mailbox name).
 * - Password Change: Resetting security codes (the front door electronic key code).
 * - Delete Account: The emergency self-destruct key that melts the database cabinet!
 */
export default function SettingsPage() {
  // State to track which settings tab is currently active.
  const [activeTab, setActiveTab] = useState<Tab>('general');
  // State to store retrieved secure user profile details
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  // State to track loading status upon mount
  const [isLoading, setIsLoading] = useState(true);

  // List of tabs containing label configurations and Lucide React icons.
  const tabs = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'profile', label: 'Profile Settings', icon: <User size={18} /> },
    { id: 'password', label: 'Change Password', icon: <Shield size={18} /> },
    { id: 'delete', label: 'Delete Account', icon: <Trash2 size={18} className="text-red-500" /> },
  ];

  // Helper method to synchronize/fetch latest user profile state from Django
  const fetchProfileDetails = async () => {
    const res = await getUserProfileAction();
    if (res.success && res.user) {
      setProfile(res.user);
    } else {
      toast.error(res.message || "Failed to load profile details.");
    }
  };

  // Fetch active profile records immediately on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await fetchProfileDetails();
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Display highly aesthetic minimalist skeleton during secure server fetch operations
  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="max-w-4xl space-y-8 animate-pulse">
          <div>
            <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-900 rounded-md mt-2" />
          </div>
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 py-4">
            <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-6 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="space-y-6 py-4">
            <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-bounce" />
            <div className="h-28 w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800" />
            <div className="h-28 w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
        
        {/* Title and description */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">Settings</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Configure system configurations, profile fields, password signatures, and account lifecycles.
          </p>
        </div>

        {/* TABS TRAY (Responsive grid for mobile layouts) */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800/80 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-black dark:border-white text-black dark:text-white" 
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ACTIVE TAB CONTENT ROUTER */}
        <div className="py-4">
          {activeTab === 'general' && profile && (
            <GeneralSettingsTab profile={profile} onRefresh={fetchProfileDetails} />
          )}
          {activeTab === 'profile' && profile && (
            <ProfileSettingsTab profile={profile} onRefresh={fetchProfileDetails} />
          )}
          {activeTab === 'password' && <PasswordSettingsTab />}
          {activeTab === 'delete' && <DeleteSettingsTab />}
        </div>

      </div>
    </DashboardWrapper>
  );
}

/* ============================================================================== */
/* TAB: GENERAL SETTINGS */
/* ============================================================================== */
interface GeneralSettingsTabProps {
  profile: UserProfileData;
  onRefresh: () => Promise<void>;
}

function GeneralSettingsTab({ profile, onRefresh }: GeneralSettingsTabProps) {
  // State to track transition loading indicators when committing checkbox state
  const [isUpdatingNotify, setIsUpdatingNotify] = useState(false);
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);

  // Securely update notification settings inside active DB profile record
  const handleToggleEmail = async (checked: boolean) => {
    setIsUpdatingNotify(true);
    // Dispatch PUT request with partial keys to preserve name and bio records
    const res = await updateUserProfileAction({ email_notification: checked });
    if (res.success) {
      toast.success(`Notifications ${checked ? 'activated' : 'deactivated'}`);
      // Instruct parent dashboard component to fetch latest DB state
      await onRefresh();
    } else {
      toast.error(res.message || "Failed to update notification settings.");
    }
    setIsUpdatingNotify(false);
  };

  // Securely update profile visibility settings inside active DB profile record
  const handleTogglePublic = async (checked: boolean) => {
    setIsUpdatingPublic(true);
    // Dispatch PUT request targeting public visibility flag
    const res = await updateUserProfileAction({ public_profile: checked });
    if (res.success) {
      toast.success(`Profile visibility: ${checked ? 'Public' : 'Private'}`);
      await onRefresh();
    } else {
      toast.error(res.message || "Failed to update profile visibility.");
    }
    setIsUpdatingPublic(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-4">
        <h3 className="text-base font-bold text-zinc-950 dark:text-white pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          Preferences & Notifications
        </h3>
        
        {/* Toggle option: Email notifications */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all bg-white dark:bg-zinc-900/10">
          <div className="flex gap-4">
            <div className="text-zinc-400 mt-0.5"><Bell size={20} /></div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Email Notifications</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive updates about project activity and rate limits alerts.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={profile.email_notification} 
              disabled={isUpdatingNotify}
              onChange={(e) => handleToggleEmail(e.target.checked)}
            />
            <div className="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white dark:peer-checked:after:bg-black"></div>
          </label>
        </div>

        {/* Toggle option: Public Profile */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all bg-white dark:bg-zinc-900/10">
          <div className="flex gap-4">
            <div className="text-zinc-400 mt-0.5"><Globe size={20} /></div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Public Profile</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Allow other workspace team members to inspect your active build states.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={profile.public_profile} 
              disabled={isUpdatingPublic}
              onChange={(e) => handleTogglePublic(e.target.checked)}
            />
            <div className="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white dark:peer-checked:after:bg-black"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================== */
/* TAB: PROFILE SETTINGS */
/* ============================================================================== */
interface ProfileSettingsTabProps {
  profile: UserProfileData;
  onRefresh: () => Promise<void>;
}

function ProfileSettingsTab({ profile, onRefresh }: ProfileSettingsTabProps) {
  // State to hold and clean local form data
  const [formData, setFormData] = useState({
    fullName: profile.full_name || '',
    bio: profile.bio || '',
  });
  // State to manage loading spinners during submit patches
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if profile prop changes on updates
  useEffect(() => {
    setFormData({
      fullName: profile.full_name || '',
      bio: profile.bio || '',
    });
  }, [profile]);

  // Handle PUT submission targeting profile details
  const handleSave = async () => {
    setIsSaving(true);
    const cleanedName = formData.fullName.trim();
    
    // Core boundary check to guarantee clean database indexes
    if (!cleanedName) {
      toast.error("Full Name cannot be empty.");
      setIsSaving(false);
      return;
    }

    const payload = {
      full_name: cleanedName,
      bio: formData.bio,
    };

    const res = await updateUserProfileAction(payload);
    if (res.success) {
      toast.success('Profile changes successfully saved!');
      await onRefresh();
    } else {
      toast.error(res.message || 'Failed to save profile changes.');
    }
    setIsSaving(false);
  };

  // Helper method to resolve fallback initials for user initials avatars
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === '') return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-base font-bold text-zinc-950 dark:text-white pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        Personal Information
      </h3>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* Avatar change container */}
        <div className="relative group mx-auto md:mx-0 shrink-0">
          <div className="h-28 w-28 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.full_name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-zinc-400">{getInitials(profile.full_name)}</span>
            )}
          </div>
          <button 
            onClick={() => toast.info('Photo upload selector mock triggered. We will configure direct Cloudinary upload in the next step!')}
            className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-lg border-2 border-white dark:border-zinc-950 transition-transform hover:scale-110 cursor-pointer"
          >
            <Camera size={14} />
          </button>
        </div>

        {/* Input grids */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Full Name</label>
            <input 
              type="text" 
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Destiny Frank"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30 outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email Address (Read-Only)</label>
            <input 
              type="email" 
              value={profile.email}
              disabled
              className="w-full rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Biography</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full min-h-[100px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-sm transition-all focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30 outline-none resize-none"
              placeholder="Tell the community about yourself..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? "Saving..." : "Save Profile Details"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================== */
/* TAB: PASSWORD SETTINGS */
/* ============================================================================== */
function PasswordSettingsTab() {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdate = () => {
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Please populate all password key inputs.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password keys confirm miss.');
      return;
    }
    toast.success('Credentials keys successfully scrambled (Mock UI)!');
    setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-base font-bold text-zinc-950 dark:text-white pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        Change Password
      </h3>

      <div className="max-w-md space-y-4">
        
        {/* Input group: Old Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Current Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-955 dark:group-focus-within:text-white transition-colors">
              <Lock size={16} />
            </div>
            <input 
              type="password" 
              value={passwords.oldPassword}
              onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-11 pr-4 text-sm transition-all focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30 outline-none"
            />
          </div>
        </div>

        {/* Input group: New Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">New Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-955 dark:group-focus-within:text-white transition-colors">
              <Lock size={16} />
            </div>
            <input 
              type="password" 
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-11 pr-4 text-sm transition-all focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30 outline-none"
            />
          </div>
        </div>

        {/* Input group: Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Confirm New Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-955 dark:group-focus-within:text-white transition-colors">
              <Lock size={16} />
            </div>
            <input 
              type="password" 
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-11 pr-4 text-sm transition-all focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-900/30 outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleUpdate}
          className="mt-2 w-full px-6 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:shadow-md cursor-pointer transition-shadow"
        >
          Update Secure Password
        </button>

      </div>
    </div>
  );
}

/* ============================================================================== */
/* TAB: DELETE ACCOUNT */
/* ============================================================================== */
function DeleteSettingsTab() {
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    if (confirmText.toLowerCase() !== 'delete') {
      toast.error("Please enter the word 'delete' to proceed.");
      return;
    }
    toast.error('Self-destruct database cascade sequence complete (Mock UI)!');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-base font-bold text-red-500 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        Delete Account Area
      </h3>

      <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex items-start gap-3">
        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-red-950 dark:text-red-300">Warning: Permanent Action</h4>
          <p className="text-xs text-red-750 dark:text-red-400/80 leading-relaxed">
            Deleting your account will trigger a complete cascade delete query across the platform's database. This will melt down your profile card, your active OTP history registers, your team mappings, and secure keys. This action cannot be reversed!
          </p>
        </div>
      </div>

      <div className="max-w-md space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Type <span className="font-extrabold text-red-500">delete</span> to authorize deletion
          </label>
          <input 
            type="text" 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30 outline-none font-medium"
          />
        </div>

        <button 
          onClick={handleDelete}
          className="w-full px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
        >
          Authorize Account Melt Down
        </button>
      </div>
    </div>
  );
}
