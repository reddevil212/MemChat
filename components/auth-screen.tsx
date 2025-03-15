"use client"

import { useCallback } from "react"
import { MessageSquare } from "lucide-react"
import { AuthService } from "./auth-service"
import { useAuthForm } from "./use-auth-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoogleIcon } from "./icons_GoogleIcon"

export default function AuthScreen() {
  const loginForm = useAuthForm({ email: "", password: "" })
  const registerForm = useAuthForm({ email: "", password: "", name: "" })

  const handleAuth = useCallback(async (
    type: "login" | "register",
    e: React.FormEvent
  ) => {
    e.preventDefault()
    const { setLoading, setError, formState, resetForm } = type === "login" ? loginForm : registerForm

    setLoading(true)
    setError(null)

    try {
      if (type === "login") {
        await AuthService.emailSignIn(formState)
      } else {
        if (!formState.name) throw new Error("Name is required")
        await AuthService.emailSignUp(formState as Required<typeof formState>)
      }
      resetForm()
      window.location.reload()
    } catch (err: any) {
      setError({ message: err.message || `Failed to ${type}` })
    } finally {
      setLoading(false)
    }
  }, [loginForm, registerForm])

  const handleGoogleAuth = useCallback(async () => {
    loginForm.setLoading(true)
    loginForm.setError(null)

    try {
      await AuthService.googleSignIn()
      window.location.reload()
    } catch (err: any) {
      loginForm.setError({ message: err.message || "Failed to login with Google" })
    } finally {
      loginForm.setLoading(false)
    }
  }, [loginForm])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1e1d1d] p-4">
      <Card className="w-full max-w-md bg-[#2a2a2a] border-gray-800 shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center border-b border-gray-800">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-white">MemChat</CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Connect with friends and family
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1e1d1d] p-1 gap-1">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white text-gray-400"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white text-gray-400"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {(loginForm.error || registerForm.error) && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-3 py-2 rounded mt-4 text-sm">
                {loginForm.error?.message || registerForm.error?.message}
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={(e) => handleAuth("login", e)} className="space-y-4 mt-4">
                <AuthInput
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginForm.formState.email}
                  onChange={loginForm.handleInputChange}
                />
                <AuthInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.formState.password}
                  onChange={loginForm.handleInputChange}
                />
                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  disabled={loginForm.loading}
                >
                  {loginForm.loading ? "Logging in..." : "Login"}
                </Button>
                <Button
                  type="button"
                  className="w-full bg-[#1e1d1d] hover:bg-[#252525] text-white border border-gray-700 transition-colors"
                  onClick={handleGoogleAuth}
                  disabled={loginForm.loading}
                >
                  {loginForm.loading ? (
                    "Logging in..."
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <GoogleIcon className="w-5 h-5" />
                      <span>Login with Google</span>
                    </div>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={(e) => handleAuth("register", e)} className="space-y-4 mt-4">
                <AuthInput
                  label="Full Name"
                  name="name"
                  placeholder="John Doe"
                  value={registerForm.formState.name || ""}
                  onChange={registerForm.handleInputChange}
                />
                <AuthInput
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={registerForm.formState.email}
                  onChange={registerForm.handleInputChange}
                />
                <AuthInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={registerForm.formState.password}
                  onChange={registerForm.handleInputChange}
                />
                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  disabled={registerForm.loading}
                >
                  {registerForm.loading ? "Creating account..." : "Register"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-gray-800">
          <p className="text-xs text-gray-400">
            By continuing, you agree to our Terms of Service
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

function AuthInput({ label, ...props }: AuthInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name} className="text-gray-300 text-sm">
        {label}
      </Label>
      <Input
        {...props}
        required
        className="bg-[#1e1d1d] border-gray-700 text-white focus:ring-1 focus:ring-gray-600 text-sm"
      />
    </div>
  )
}