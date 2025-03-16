"use client"

import { useCallback, useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { AuthService } from "./auth-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { GoogleIcon } from "./icons_GoogleIcon"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, MessageSquare } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Switch } from "@/components/ui/switch"

// Login form schema
const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

// Register form schema
const registerFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type LoginFormValues = z.infer<typeof loginFormSchema>
type RegisterFormValues = z.infer<typeof registerFormSchema>

export default function AuthScreen() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Handle theme mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const onLoginSubmit = useCallback(async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      await AuthService.emailSignIn(data)
      loginForm.reset()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }, [loginForm])

  const onRegisterSubmit = useCallback(async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      await AuthService.emailSignUp(data)
      registerForm.reset()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to register")
    } finally {
      setIsLoading(false)
    }
  }, [registerForm])

  const handleGoogleAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await AuthService.googleSignIn()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to login with Google")
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black text-black dark:text-white p-6 md:p-8"
      >
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <Switch
            checked={theme === "dark"}
            onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          />
          <Sun className="h-5 w-5" />
          <Moon className="h-5 w-5" />
        </div>

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 rounded-full  flex items-center justify-center mb-4">
            <MessageSquare className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">MemChat</h1>
          <p className="mt-2">Connect seamlessly. Chat endlessly.</p>
        </motion.div>

        <Card className="w-full max-w-lg shadow-lg border-0 overflow-hidden bg-white dark:bg-black">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid dark:bg-black w-full grid-cols-2 h-14">
                <TabsTrigger
                  value="login"
                  className="text-base relative"
                >
                  Sign In
                  {theme === "dark" && (
                    <motion.div
                      layoutId="outline"
                      className="absolute inset-0 "
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {theme === "light" && (
                    <motion.div
                      layoutId="outline"
                      className="absolute inset-0 "
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-base relative"
                >
                  Create Account
                  {theme === "dark" && (
                    <motion.div
                      layoutId="outline"
                      className="absolute inset-0 "
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {theme === "light" && (
                    <motion.div
                      layoutId="outline"
                      className="absolute inset-0 "
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-100 dark:bg-gray-800 border  dark:border-gray-600 text-red-700 px-4 py-3 rounded-md mb-4 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <TabsContent value="login" className="mt-0 pt-2">
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="name@example.com"
                                  type="email"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Password</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="••••••••"
                                  type="password"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full h-11 font-medium"
                          disabled={isLoading}
                        >
                          {isLoading ? "Authenticating..." : "Sign In"}
                        </Button>

                        <div className="relative my-5">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black px-2 text-xs">
                            OR CONTINUE WITH
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11 font-medium"
                          onClick={handleGoogleAuth}
                          disabled={isLoading}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <GoogleIcon className="w-5 h-5" />
                            <span>Google</span>
                          </div>
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="register" className="mt-0 pt-2">
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John Doe"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="name@example.com"
                                  type="email"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Password</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="At least 6 characters"
                                  type="password"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full h-11 font-medium"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-center px-6 py-4 text-center">
            <p className="text-xs">
              By continuing, you agree to our <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy Policy</span>
            </p>
          </CardFooter>
        </Card>

        <p className="text-xs mt-6">
          © {new Date().getFullYear()} MemChat. All rights reserved.
        </p>
      </motion.div>
    </AnimatePresence>
  )
}