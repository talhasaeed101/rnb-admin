import type { PromoCode } from "@/types";

export const initialPromoCodes: PromoCode[] = [
  {
    "id": "promo-1",
    "code": "WELCOME10",
    "discountType": "percentage",
    "discountValue": 10,
    "minOrder": 50,
    "maxDiscount": 40,
    "usageLimit": 500,
    "usageCount": 128,
    "startDate": "2026-01-01",
    "expiryDate": "2026-12-31",
    "status": "active"
  },
  {
    "id": "promo-2",
    "code": "RNB15",
    "discountType": "percentage",
    "discountValue": 15,
    "minOrder": 100,
    "maxDiscount": 75,
    "usageLimit": 200,
    "usageCount": 86,
    "startDate": "2026-06-01",
    "expiryDate": "2026-10-31",
    "status": "active"
  },
  {
    "id": "promo-3",
    "code": "FIRSTORDER",
    "discountType": "fixed",
    "discountValue": 20,
    "minOrder": 80,
    "maxDiscount": null,
    "usageLimit": 1000,
    "usageCount": 412,
    "startDate": "2026-01-01",
    "expiryDate": "2026-12-31",
    "status": "active"
  },
  {
    "id": "promo-4",
    "code": "SUMMER25",
    "discountType": "percentage",
    "discountValue": 25,
    "minOrder": 150,
    "maxDiscount": 100,
    "usageLimit": 100,
    "usageCount": 100,
    "startDate": "2026-05-01",
    "expiryDate": "2026-08-31",
    "status": "expired"
  },
  {
    "id": "promo-5",
    "code": "VIP50",
    "discountType": "fixed",
    "discountValue": 50,
    "minOrder": 300,
    "maxDiscount": null,
    "usageLimit": 50,
    "usageCount": 12,
    "startDate": "2026-09-01",
    "expiryDate": "2026-12-15",
    "status": "inactive"
  }
];
