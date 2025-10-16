"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLoading } from "@/context/LoadingContext";
import Link from "next/link";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  employee_id: string;
  role: string;
  department: string;
  location: string;
}

interface LoginResponse {
  status: string;
  accessToken: string;
  accessTokenExpiry: number;
  refreshToken: string;
  user: User;
}

export default function LoginPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const { loading, setLoading } = useLoading();

  const redirectToDashboard = (role: string) => {
    if (role === "hr_admin") {
      router.push("/dashboard/admin");
    } else if (role === "manager") {
      router.push("/dashboard/manager");
    } else {
      router.push("/dashboard/employee");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Start loading

    // ... validation checks

    try {
      const res = await fetch(`${apiBaseUrl}api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid credentials! Check your email and password.");
        setLoading(false);
        return;
      }

      const data: LoginResponse = await res.json();
      if (!data.accessToken || !data.user?.role) {
        setError("Login failed. Invalid response from server.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("role", data.user.role);
      sessionStorage.setItem(
        "name",
        data.user.firstName + " " + data.user.lastName
      );
      sessionStorage.setItem("empId", data.user.employee_id);
      sessionStorage.setItem("id", data.user.id.toString());

      redirectToDashboard(data.user.role);
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-50 to-gray-100">
        {/* Card with Image and Form */}
        <Card className="w-full max-w-3xl shadow-xl rounded-xl border border-gray-200 bg-white sm:m-3">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Left column with image */}
            <div className="hidden md:block w-ful md:w-1/2">
              <Image
                src="/LoginImage3.jpg" // Replace with the path to your image
                alt="Login Image"
                width={800} // Adjust size based on your design needs
                height={800} // Adjust size based on your design needs
                objectFit="cover"
                className="rounded-sm shadow-lg bold"
              />
            </div>

            {/* Right column with the login form */}
            <div className="w-full md:w-1/2 mr-2">
              <CardHeader className="text-center">
                <CardTitle className="text-blue-700 font-bold text-4xl flex items-center justify-center space-x-1">
                  <Image
                    src="/ArviusLogo.ico.png" // Path to your logo image
                    alt="Logo"
                    width={60}
                    height={60}
                  />
                  <span>ARVIUS</span>
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Sign In to your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Input
                      className="w-full p-4 border-2 border-gray-300 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <Input
                      className="w-full p-4 border-2 border-gray-300 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md shadow-sm"
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className={`w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center`}
                    disabled={loading}
                  >
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 014 4h4a8 8 0 11-16 0z"
                        ></path>
                      </svg>
                    ) : (
                      "LOGIN"
                    )}
                  </Button>

                  <div className="text-sm mt-4 text-gray-500 text-center">
                    Forgot password?{" "}
                    <Link
                      href="/forgot-password"
                      className="text-gray-600 hover:text-blue-600 hover:underline font-medium"
                    >
                      Click here!
                    </Link>
                  </div>
                </form>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
