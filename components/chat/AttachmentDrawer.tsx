"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileImage, FileText, FolderKanban, Upload } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface AttachmentDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (file: File | null, type: string) => void
}

export const AttachmentDrawer = ({
  isOpen,
  onOpenChange,
  onFileSelect
}: AttachmentDrawerProps) => {
  const [activeTab, setActiveTab] = useState("photos")

  // Create a hidden file input for each type
  const createFileInput = (accept: string, type: string) => {
    return () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.style.display = 'none'

      input.addEventListener('change', (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files && files.length > 0) {
          // Pass the actual file to onFileSelect
          onFileSelect(files[0], type)
          // Close the drawer
          onOpenChange(false)
        }
      })

      document.body.appendChild(input)
      input.click()

      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(input)
      }, 1000)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="focus:outline-none">
        <DrawerHeader>
          <DrawerTitle>Attachments</DrawerTitle>
          <DrawerDescription>Choose a file to attach to your message</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-2">
          <Tabs
            defaultValue="photos"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="photos" className="flex flex-col items-center py-2">
                <FileImage className="h-5 w-5 mb-1" />
                <span className="text-xs">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex flex-col items-center py-2">
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-xs">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="others" className="flex flex-col items-center py-2">
                <FolderKanban className="h-5 w-5 mb-1" />
                <span className="text-xs">Others</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-4">
              <div className="flex flex-col space-y-3">
                <p className="text-sm text-muted-foreground mb-2">Select photos to upload</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={createFileInput('image/*', 'photo')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Photos
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div className="flex flex-col space-y-3">
                <p className="text-sm text-muted-foreground mb-2">Select documents to upload</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "PDF", accept: ".pdf", icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
                    { name: "Word", accept: ".doc,.docx", icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
                    { name: "Excel", accept: ".xls,.xlsx", icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
                    { name: "Text", accept: ".txt", icon: <FileText className="h-5 w-5 text-muted-foreground" /> }
                  ].map((type) => (
                    <div
                      key={type.name}
                      className="p-3 bg-muted rounded-md flex items-center space-x-2 cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={createFileInput(type.accept, 'document')}
                      aria-label={`Select ${type.name} file`}
                      role="button"
                      tabIndex={0}
                    >
                      {type.icon}
                      <span className="text-sm">{type.name}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={createFileInput('.pdf,.doc,.docx,.xls,.xlsx,.txt', 'document')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Documents
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="others" className="mt-4">
              <div className="flex flex-col space-y-3">
                <p className="text-sm text-muted-foreground mb-2">Upload other file types</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Audio", accept: "audio/*", icon: <FolderKanban className="h-5 w-5 text-muted-foreground" /> },
                    { name: "Video", accept: "video/*", icon: <FolderKanban className="h-5 w-5 text-muted-foreground" /> },
                    { name: "Archives", accept: ".zip,.rar,.7z", icon: <FolderKanban className="h-5 w-5 text-muted-foreground" /> },
                    { name: "Other", accept: "*", icon: <FolderKanban className="h-5 w-5 text-muted-foreground" /> }
                  ].map((type) => (
                    <div
                      key={type.name}
                      className="p-3 bg-muted rounded-md flex items-center space-x-2 cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={createFileInput(type.accept, 'other')}
                      aria-label={`Select ${type.name} file`}
                      role="button"
                      tabIndex={0}
                    >
                      {type.icon}
                      <span className="text-sm">{type.name}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={createFileInput('*', 'other')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}