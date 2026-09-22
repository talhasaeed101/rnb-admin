import type { Order } from "@/types";

export const initialOrders: Order[] = [
  {
    "id": "ord-001",
    "orderNumber": "RNB-2401",
    "customerId": "cust-1",
    "customerName": "James Carter",
    "customerEmail": "james@email.com",
    "items": [
      {
        "productId": "prod-002",
        "name": "Lunar Band Ring",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 2,
        "price": 99
      }
    ],
    "date": "2026-09-02T14:01:00Z",
    "subtotal": 198,
    "discount": 0,
    "shipping": 0,
    "total": 198,
    "payment": "Paid",
    "status": "Pending",
    "shippingAddress": {
      "name": "James Carter",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "James Carter",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-002",
    "orderNumber": "RNB-2402",
    "customerId": "cust-2",
    "customerName": "Sarah Jenkins",
    "customerEmail": "sarah@email.com",
    "items": [
      {
        "productId": "prod-003",
        "name": "Rose Solitaire Ring",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 1,
        "price": 289
      }
    ],
    "date": "2026-09-03T14:02:00Z",
    "subtotal": 289,
    "discount": 0,
    "shipping": 0,
    "total": 289,
    "payment": "Paid",
    "status": "Confirmed",
    "shippingAddress": {
      "name": "Sarah Jenkins",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Sarah Jenkins",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-003",
    "orderNumber": "RNB-2403",
    "customerId": "cust-3",
    "customerName": "Elena Rodriguez",
    "customerEmail": "elena@email.com",
    "items": [
      {
        "productId": "prod-004",
        "name": "Astra Cuff",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 2,
        "price": 120
      }
    ],
    "date": "2026-09-04T14:03:00Z",
    "subtotal": 240,
    "discount": 10,
    "shipping": 0,
    "total": 230,
    "payment": "Pending",
    "status": "Processing",
    "shippingAddress": {
      "name": "Elena Rodriguez",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Elena Rodriguez",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-004",
    "orderNumber": "RNB-2404",
    "customerId": "cust-4",
    "customerName": "Michael Ross",
    "customerEmail": "michael@email.com",
    "items": [
      {
        "productId": "prod-005",
        "name": "Velvet Rope Bracelet",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 1,
        "price": 75
      }
    ],
    "date": "2026-09-05T14:04:00Z",
    "subtotal": 75,
    "discount": 0,
    "shipping": 12,
    "total": 87,
    "payment": "Paid",
    "status": "Dispatched",
    "shippingAddress": {
      "name": "Michael Ross",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Michael Ross",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": "DHL Express",
    "trackingNumber": "DHL900004",
    "dispatchDate": "2026-09-06",
    "notes": ""
  },
  {
    "id": "ord-005",
    "orderNumber": "RNB-2405",
    "customerId": "cust-5",
    "customerName": "Ava Chen",
    "customerEmail": "ava@email.com",
    "items": [
      {
        "productId": "prod-006",
        "name": "Midnight Hoops",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 2,
        "price": 55
      }
    ],
    "date": "2026-09-06T14:05:00Z",
    "subtotal": 110,
    "discount": 0,
    "shipping": 12,
    "total": 122,
    "payment": "Paid",
    "status": "Delivered",
    "shippingAddress": {
      "name": "Ava Chen",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Ava Chen",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": "DHL Express",
    "trackingNumber": "DHL900005",
    "dispatchDate": "2026-09-07",
    "notes": ""
  },
  {
    "id": "ord-006",
    "orderNumber": "RNB-2406",
    "customerId": "cust-6",
    "customerName": "Noah Patel",
    "customerEmail": "noah@email.com",
    "items": [
      {
        "productId": "prod-007",
        "name": "Golden Aura Necklace",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 1,
        "price": 145
      }
    ],
    "date": "2026-09-07T14:06:00Z",
    "subtotal": 145,
    "discount": 10,
    "shipping": 12,
    "total": 147,
    "payment": "Refunded",
    "status": "Cancelled",
    "shippingAddress": {
      "name": "Noah Patel",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Noah Patel",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-007",
    "orderNumber": "RNB-2407",
    "customerId": "cust-1",
    "customerName": "James Carter",
    "customerEmail": "james@email.com",
    "items": [
      {
        "productId": "prod-008",
        "name": "Lunar Band Ring",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 2,
        "price": 99
      }
    ],
    "date": "2026-09-08T14:07:00Z",
    "subtotal": 198,
    "discount": 0,
    "shipping": 0,
    "total": 198,
    "payment": "Paid",
    "status": "Delivered",
    "shippingAddress": {
      "name": "James Carter",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "James Carter",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": "DHL Express",
    "trackingNumber": "DHL900007",
    "dispatchDate": "2026-09-09",
    "notes": ""
  },
  {
    "id": "ord-008",
    "orderNumber": "RNB-2408",
    "customerId": "cust-2",
    "customerName": "Sarah Jenkins",
    "customerEmail": "sarah@email.com",
    "items": [
      {
        "productId": "prod-009",
        "name": "Rose Solitaire Ring",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 1,
        "price": 289
      }
    ],
    "date": "2026-09-09T14:08:00Z",
    "subtotal": 289,
    "discount": 0,
    "shipping": 0,
    "total": 289,
    "payment": "Paid",
    "status": "Processing",
    "shippingAddress": {
      "name": "Sarah Jenkins",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Sarah Jenkins",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-009",
    "orderNumber": "RNB-2409",
    "customerId": "cust-3",
    "customerName": "Elena Rodriguez",
    "customerEmail": "elena@email.com",
    "items": [
      {
        "productId": "prod-010",
        "name": "Astra Cuff",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 2,
        "price": 120
      }
    ],
    "date": "2026-09-10T14:09:00Z",
    "subtotal": 240,
    "discount": 10,
    "shipping": 0,
    "total": 230,
    "payment": "Failed",
    "status": "Pending",
    "shippingAddress": {
      "name": "Elena Rodriguez",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Elena Rodriguez",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-010",
    "orderNumber": "RNB-2410",
    "customerId": "cust-4",
    "customerName": "Michael Ross",
    "customerEmail": "michael@email.com",
    "items": [
      {
        "productId": "prod-011",
        "name": "Velvet Rope Bracelet",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 1,
        "price": 75
      }
    ],
    "date": "2026-09-11T14:10:00Z",
    "subtotal": 75,
    "discount": 0,
    "shipping": 12,
    "total": 87,
    "payment": "Paid",
    "status": "Confirmed",
    "shippingAddress": {
      "name": "Michael Ross",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Michael Ross",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": null,
    "trackingNumber": null,
    "dispatchDate": null,
    "notes": ""
  },
  {
    "id": "ord-011",
    "orderNumber": "RNB-2411",
    "customerId": "cust-5",
    "customerName": "Ava Chen",
    "customerEmail": "ava@email.com",
    "items": [
      {
        "productId": "prod-012",
        "name": "Midnight Hoops",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 2,
        "price": 55
      }
    ],
    "date": "2026-09-12T14:11:00Z",
    "subtotal": 110,
    "discount": 0,
    "shipping": 12,
    "total": 122,
    "payment": "Paid",
    "status": "Dispatched",
    "shippingAddress": {
      "name": "Ava Chen",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Ava Chen",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": "DHL Express",
    "trackingNumber": "DHL900011",
    "dispatchDate": "2026-09-13",
    "notes": ""
  },
  {
    "id": "ord-012",
    "orderNumber": "RNB-2412",
    "customerId": "cust-6",
    "customerName": "Noah Patel",
    "customerEmail": "noah@email.com",
    "items": [
      {
        "productId": "prod-013",
        "name": "Golden Aura Necklace",
        "image": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
        "quantity": 1,
        "price": 145
      }
    ],
    "date": "2026-09-13T14:12:00Z",
    "subtotal": 145,
    "discount": 10,
    "shipping": 12,
    "total": 147,
    "payment": "Paid",
    "status": "Delivered",
    "shippingAddress": {
      "name": "Noah Patel",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "billingAddress": {
      "name": "Noah Patel",
      "line1": "14 Bond Street",
      "line2": "Suite 2",
      "city": "London",
      "state": "England",
      "postalCode": "W1S 1AD",
      "country": "United Kingdom",
      "phone": "+44 20 7946 0123"
    },
    "courier": "DHL Express",
    "trackingNumber": "DHL900012",
    "dispatchDate": "2026-09-14",
    "notes": ""
  }
];
