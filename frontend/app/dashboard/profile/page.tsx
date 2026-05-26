"use client";

import React, { useState, useEffect } from "react";
import DashboardWrapper from "@/components/dashboard/DashboardWrapper";
import { User, Mail, ShieldAlert, Calendar, Code, Globe, CheckCircle2, ShieldCheck } from "lucide-react";
// Import Sonner toast notification manager for client feedback
import { toast } from "sonner";
// Import our secure profile retrieval server action
import { getUserProfileAction } from "@/app/actions/auth";

/**
 * Type interface for user profile data structure returned by serializer
 */
interface UserProfileData {
    email: string;
    full_name: string;
    bio: string;
    avatar: string;
    email_notification: boolean;
    public_profile: boolean;
    created_at: string;
}

/**
 * USER PROFILE INFORMATION PAGE
 *
 * Analogy:
 * Think of this like a digital driver's license.
 * It houses all your official details—your photograph, your address (email), your birthdate (joined date),
 * and any stamps of authenticity (like GitHub or Google oauth connections)—all laid out beautifully
 * in a secure dashboard layout!
 */
export default function UserProfilePage() {
    // State hook to store the dynamically retrieved profile data
    const [profile, setProfile] = useState<UserProfileData | null>(null);

    // State hook to manage loading transition states upon page mount
    const [isLoading, setIsLoading] = useState(true);

    // Asynchronous method to handshake with our Next.js Server Action
    const fetchProfileDetails = async () => {
        try {
            // 1. Dispatch secure server action to read HttpOnly access token and call Django REST view
            const res = await getUserProfileAction();

            if (res.success && res.user) {
                // 2. Set retrieved user object inside our active state
                setProfile(res.user as UserProfileData);
            } else {
                // 3. Fallback toast alert if credentials expired or failed to connect
                toast.error(res.message || "Failed to load profile details.");
            }
        } catch (err: any) {
            // 4. Capture connection drops or unexpected execution errors
            toast.error("An unexpected error occurred while loading your profile.");
        }
    };

    // Mount effect running immediately when user lands on this page
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            // Wait for server action retrieve routines to complete
            await fetchProfileDetails();
            setIsLoading(false);
        }
        loadData();
    }, []);

    // Helper routine to format ISO date strings into readable calendar formats
    const formatMemberSince = (dateString?: string) => {
        if (!dateString) return "May 26, 2026";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "May 26, 2026";
        }
    };

    // Helper routine to extract initials from full name string for avatar fallback
    const getInitials = (name?: string) => {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Render a clean loading skeleton structure matching dashboard style guides
    if (isLoading) {
        return (
            <DashboardWrapper>
                <div className="max-w-4xl space-y-8 animate-pulse">
                    <div>
                        <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                        <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-900/60 rounded-md mt-2" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 flex flex-col items-center space-y-4 h-64 justify-center">
                            <div className="w-24 h-24 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-900/60 rounded-md" />
                            <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-900/60 rounded-md" />
                        </div>
                        <div className="md:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-6">
                            <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="h-3 w-16 bg-zinc-150 dark:bg-zinc-900 rounded" />
                                    <div className="h-5 w-36 bg-zinc-100 dark:bg-zinc-850 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-16 bg-zinc-150 dark:bg-zinc-900 rounded" />
                                    <div className="h-5 w-36 bg-zinc-100 dark:bg-zinc-850 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardWrapper>
        );
    }

    // Fallback in case profile record returns null after load routines
    if (!profile) {
        return (
            <DashboardWrapper>
                <div className="max-w-md mx-auto py-12 text-center space-y-4">
                    <ShieldAlert className="text-amber-500 mx-auto animate-bounce" size={48} />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Profile Data Unavailable</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">We were unable to retrieve your profile card records. Please try logging in again.</p>
                </div>
            </DashboardWrapper>
        );
    }

    return (
        <DashboardWrapper>
            <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
                {/* Title Heading */}
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">My Profile</h1>
                    <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">View your personal identity details, active credentials, and linked accounts.</p>
                </div>

                {/* Profile Card layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Avatar & Quick Stats Card */}
                    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm h-fit">
                        {/* Styled Avatar image container with dynamic fallback routing */}
                        {profile.avatar ? <img src={profile.avatar} alt={profile.full_name || "User Avatar"} className="w-24 h-24 rounded-3xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-lg" /> : <div className="w-24 h-24 rounded-3xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-3xl font-black shadow-lg border border-zinc-250 dark:border-zinc-700">{getInitials(profile.full_name)}</div>}

                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-zinc-950 dark:text-white">{profile.full_name || "Anonymous Coder"}</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{profile.email}</p>
                        </div>

                        {/* Display Admin role tag dynamically if using staff status or specific configuration */}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-150 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-wider">
                            <ShieldCheck size={12} className="text-emerald-500" /> Authorized User
                        </span>

                        <div className="w-full border-t border-zinc-100 dark:border-zinc-800/80 pt-4 flex justify-around text-zinc-500 text-xs">
                            <div className="flex flex-col">
                                <span className="font-extrabold text-zinc-900 dark:text-white">{profile.public_profile ? "Public" : "Private"}</span>
                                <span>Visibility</span>
                            </div>
                            <div className="w-[1px] bg-zinc-100 dark:bg-zinc-800" />
                            <div className="flex flex-col">
                                <span className="font-extrabold text-zinc-900 dark:text-white">{profile.email_notification ? "Enabled" : "Disabled"}</span>
                                <span>Alerts</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Info Form Layout */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Card: Account Information */}
                        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 space-y-6">
                            <h3 className="text-base font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-zinc-800/85 pb-3">Account Information</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Field: Full Name */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</span>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                                        <User size={16} className="text-zinc-400" />
                                        <span>{profile.full_name || "Not provided"}</span>
                                    </div>
                                </div>

                                {/* Field: Email */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Primary Email</span>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                                        <Mail size={16} className="text-zinc-400" />
                                        <span className="break-all">{profile.email}</span>
                                    </div>
                                </div>

                                {/* Field: Created Date */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Member Since</span>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                                        <Calendar size={16} className="text-zinc-400" />
                                        <span>{formatMemberSince(profile.created_at)}</span>
                                    </div>
                                </div>

                                {/* Field: Scope */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Scope</span>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                                        <ShieldAlert size={16} className="text-zinc-400" />
                                        <span>Standard Account</span>
                                    </div>
                                </div>
                            </div>

                            {/* Biography Section */}
                            <div className="space-y-2 pt-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Biography</span>
                                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350">{profile.bio || "No biography has been added to this profile yet. Go to your settings dashboard to update your profile bio card description!"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardWrapper>
    );
}
