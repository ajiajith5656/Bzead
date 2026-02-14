/**
 * Input validation schemas using Zod
 * Protects against injection attacks and ensures data integrity
 */

import { z } from 'zod';

// Common patterns
const emailSchema = z.string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits');

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL must not exceed 2048 characters');

const uuidSchema = z.string()
  .uuid('Invalid ID format');

// User schemas
export const userSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  role: z.enum(['user', 'seller', 'admin']),
  phoneNumber: phoneSchema.optional(),
  currency: z.string().length(3, 'Currency code must be 3 characters').optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const otpSchema = z.object({
  code: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Product schemas
export const productSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must not exceed 200 characters')
    .trim(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const productReviewSchema = z.object({
  productId: uuidSchema,
  rating: z.number().min(1).max(5),
  title: z.string()
    .min(5, 'Review title must be at least 5 characters')
    .max(100, 'Review title must not exceed 100 characters')
    .trim(),
  comment: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(1000, 'Review must not exceed 1000 characters')
    .trim(),
});

// Address schemas
export const addressSchema = z.object({
  fullName: nameSchema,
  addressLine1: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters')
    .trim(),
  addressLine2: z.string()
    .max(200, 'Address line 2 must not exceed 200 characters')
    .trim()
    .optional(),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'City can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  state: z.string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must not exceed 100 characters')
    .trim(),
  postalCode: z.string()
    .min(3, 'Postal code must be at least 3 characters')
    .max(10, 'Postal code must not exceed 10 characters')
    .regex(/^[A-Za-z0-9\s-]+$/, 'Invalid postal code format')
    .trim(),
  country: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must not exceed 100 characters')
    .trim(),
  phoneNumber: phoneSchema,
});

// Cart/Order schemas
export const addToCartSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().min(1, 'Quantity must be at least 1').max(99, 'Quantity must not exceed 99'),
  variantId: z.string().optional(),
});

export const checkoutSchema = z.object({
  shippingAddressId: uuidSchema,
  billingAddressId: uuidSchema,
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer']),
  items: z.array(z.object({
    productId: uuidSchema,
    quantity: z.number().min(1).max(99),
    variantId: z.string().optional(),
  })).min(1, 'Cart must contain at least one item'),
});

// Admin schemas
export const banUserSchema = z.object({
  userId: uuidSchema,
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters')
    .trim(),
  duration: z.enum(['24h', '7d', '30d', 'permanent']),
});

export const createCategorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must not exceed 50 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  parentId: uuidSchema.optional(),
  imageUrl: urlSchema.optional(),
});

// File upload schemas
export const imageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

export const documentUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Document must be less than 10MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
      'Only PDF and image files are allowed'
    ),
});

// Seller KYC schemas
export const kycSubmissionSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(200, 'Business name must not exceed 200 characters')
    .trim(),
  businessType: z.string().min(1, 'Business type is required'),
  taxId: z.string()
    .min(5, 'Tax ID must be at least 5 characters')
    .max(50, 'Tax ID must not exceed 50 characters')
    .trim(),
  businessAddress: addressSchema,
  documents: z.array(documentUploadSchema).min(1, 'At least one document is required'),
});

/**
 * Sanitize HTML to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Sanitize user input for display
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 10000); // Limit length
};

export type UserSignup = z.infer<typeof userSignupSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type NewPassword = z.infer<typeof newPasswordSchema>;
export type ProductSearch = z.infer<typeof productSearchSchema>;
export type ProductReview = z.infer<typeof productReviewSchema>;
export type Address = z.infer<typeof addressSchema>;
export type AddToCart = z.infer<typeof addToCartSchema>;
export type Checkout = z.infer<typeof checkoutSchema>;
export type BanUser = z.infer<typeof banUserSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type KYCSubmission = z.infer<typeof kycSubmissionSchema>;
