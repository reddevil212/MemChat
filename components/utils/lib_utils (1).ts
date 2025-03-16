import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to get initials from a name
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Format time to include 'yesterday' logic
export const formatTime = (timestamp: string | number | Date): string => {
  const inputDate = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  const yesterday = new Date(today)

  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)

  // Check if the date is today
  if (inputDate >= today && inputDate < tomorrow) {
    return inputDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Check if the date is yesterday
  if (inputDate >= yesterday && inputDate < today) {
    return `Yesterday ${inputDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  // Check if the date is tomorrow
  if (
    inputDate >= tomorrow &&
    inputDate < new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
  ) {
    return `Tomorrow ${inputDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  // Otherwise, return the date in '15th May 2025' format
  const options = { day: "numeric", month: "long", year: "numeric" }
  const formattedDate = inputDate.toLocaleDateString("en-US", options)
  const [day, month, year] = formattedDate.split(" ")
  const ordinalDay = `${parseInt(day)}${getOrdinalSuffix(parseInt(day))}`
  return `${ordinalDay} ${month} ${year}`
}

// Helper to get ordinal suffix for a day
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th"
  }
  switch (day % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

// Format message timestamp to include 'yesterday' logic
export const formatMessageTime = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  const yesterday = new Date(today)

  tomorrow.setDate(today.getDate() + 1)
  yesterday.setDate(today.getDate() - 1)

  const isToday = date >= today && date < tomorrow
  const isTomorrow = date >= tomorrow && date < new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
  const isYesterday = date >= yesterday && date < today

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }

  if (isToday) {
    return date.toLocaleTimeString([], options)
  } else if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], options)}`
  } else if (isTomorrow) {
    return `Tomorrow ${date.toLocaleTimeString([], options)}`
  } else {
    options.month = "short"
    options.day = "numeric"
    return date.toLocaleDateString([], options) + " " + date.toLocaleTimeString([], options)
  }
}
