import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export const formatTime = (timestamp: string | number | Date): string => {
  const inputDate = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // Check if the date is today
  if (inputDate >= today && inputDate < tomorrow) {
    return inputDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Check if the date is tomorrow
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(today.getDate() + 2)
  if (inputDate >= tomorrow && inputDate < dayAfterTomorrow) {
    return "Tomorrow"
  }

  // Otherwise, return the date in '15th May 2025' format
  const options = { day: "numeric", month: "long", year: "numeric" }
  const formattedDate = inputDate.toLocaleDateString("en-US", options)
  const dateParts = formattedDate.split(" ")
  const ordinalDay = dateParts[0] + getOrdinalSuffix(parseInt(dateParts[0]))
  return `${ordinalDay} ${dateParts[1]} ${dateParts[2]}`
}

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

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  if (isToday) {
    return date.toLocaleTimeString([], options);
  } else if (isTomorrow) {
    return `Tomorrow ${date.toLocaleTimeString([], options)}`;
  } else {
    options.month = 'short';
    options.day = 'numeric';
    return date.toLocaleDateString([], options) + ' ' + date.toLocaleTimeString([], options);
  }
};