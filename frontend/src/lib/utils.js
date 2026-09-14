/**
 * Date & Auth Helpers for Forum Components
 */

export function formatElapsedTime(rawTimestamp) {
  if (!rawTimestamp) return '';

  const parsedDate = new Date(rawTimestamp);
  if (isNaN(parsedDate.getTime())) return '';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - parsedDate.getTime()) / 1000));

  if (elapsedSeconds < 10) return 'just now';

  const intervals = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'week', seconds: 604800 },
  { label: 'day', seconds: 86400 },
  { label: 'hr', seconds: 3600 },
  { label: 'min', seconds: 60 },
  { label: 'sec', seconds: 1 },
];

  for (const interval of intervals) {
    const count = Math.floor(elapsedSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

export function formatExactDate(rawTimestamp) {
  if (!rawTimestamp) return '';
  const date = new Date(rawTimestamp);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function isOwnerOfContent(itemData, activeUser, allowAdmin = true) {
  if (!itemData || !activeUser) return false;

  
  const userRole = activeUser.role?.toLowerCase();
  if (allowAdmin && (userRole === 'admin' || activeUser.isAdmin === true)) {
    return true;
  }

  // ID Extraction
  const creatorId = itemData.author?.id ?? itemData.user_id ?? itemData.userId;
  const activeUserId = activeUser.id ?? activeUser.userId;

  if (creatorId == null || activeUserId == null) return false;

  return String(creatorId) === String(activeUserId);
}

export function getUserInitials(firstName = '', lastName = '') {
  const f = firstName.trim();
  const l = lastName.trim();

  if (f && l) {
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }
  
  if (f) {
    return f.slice(0, 2).toUpperCase(); // First Name
  }

  return 'U';
}

/* Backward compatibility exports */
export const timeAgo = formatElapsedTime;
export const isAuthoredByUser = isOwnerOfContent;