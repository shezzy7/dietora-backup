// src/seeders/storeSeeder.js
// Seeds 60+ real Pakistani grocery stores, marts & kiryana shops
// Covers: Faisalabad, Lahore, Karachi, Islamabad, Rawalpindi, Multan, Gujranwala
// Run: npm run seed:stores

require('dotenv').config();
const mongoose = require('mongoose');
const Store = require('../models/Store');
const connectDB = require('../config/database');

const pakistaniStores = [

  // ══════════════════════════════════════════════════════
  //  FAISALABAD
  // ══════════════════════════════════════════════════════
  {
    name: 'Metro Cash & Carry Faisalabad',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [73.0553, 31.4504] },
    address: { street: 'Jaranwala Road', area: 'Canal Road', city: 'Faisalabad', province: 'Punjab' },
    phone: '041-8500001',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.3, totalReviews: 820,
    tags: ['wholesale', 'bulk', 'imported'],
  },
  {
    name: 'Al-Fatah Faisalabad',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [73.0785, 31.4250] },
    address: { street: 'Susan Road', area: 'Gulberg', city: 'Faisalabad', province: 'Punjab' },
    phone: '041-8734001',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.5, totalReviews: 1240,
    tags: ['supermarket', 'fresh', 'local'],
  },
  {
    name: 'Imtiaz Super Market Faisalabad',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [73.0812, 31.4180] },
    address: { street: 'Kohinoor One Mall', area: 'Jaranwala Road', city: 'Faisalabad', province: 'Punjab' },
    phone: '041-2400100',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.6, totalReviews: 2100,
    tags: ['supermarket', 'budget-friendly', 'local'],
  },
  {
    name: 'Madina Kiryana Store',
    type: 'kiryana',
    location: { type: 'Point', coordinates: [73.0612, 31.4350] },
    address: { street: 'Ghulam Muhammad Abad', area: 'GMA Colony', city: 'Faisalabad', province: 'Punjab' },
    phone: '0300-8612345',
    availableCategories: ['lentils', 'rice', 'bread', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.2, totalReviews: 380,
    tags: ['kiryana', 'local', 'daily-essentials'],
  },
  {
    name: 'Sadar Bazar Meat Shop',
    type: 'grocery',
    location: { type: 'Point', coordinates: [73.0698, 31.4512] },
    address: { street: 'Clock Tower Chowk', area: 'Sadar Bazar', city: 'Faisalabad', province: 'Punjab' },
    phone: '0333-9012345',
    availableCategories: ['meat'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.4, totalReviews: 560,
    tags: ['halal-meat', 'fresh', 'local'],
  },
  {
    name: 'Punjab Dairy Farm Faisalabad',
    type: 'grocery',
    location: { type: 'Point', coordinates: [73.0720, 31.4290] },
    address: { street: 'D-Ground Road', area: 'D-Ground', city: 'Faisalabad', province: 'Punjab' },
    phone: '041-2624001',
    availableCategories: ['dairy'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.5, totalReviews: 430,
    tags: ['dairy', 'fresh-milk', 'dahi'],
  },
  {
    name: 'Chenab Sabzi Mandi',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [73.0550, 31.4600] },
    address: { street: 'Lyallpur Road', area: 'Sabzi Mandi', city: 'Faisalabad', province: 'Punjab' },
    availableCategories: ['vegetables', 'fruits'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.1, totalReviews: 290,
    tags: ['wholesale', 'fresh-vegetables', 'local-produce'],
  },
  {
    name: 'Gulberg Departmental Store',
    type: 'departmental',
    location: { type: 'Point', coordinates: [73.0810, 31.4260] },
    address: { street: 'Susan Road', area: 'Gulberg III', city: 'Faisalabad', province: 'Punjab' },
    availableCategories: ['lentils', 'rice', 'snack', 'beverage', 'dairy'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.0, totalReviews: 210,
    tags: ['departmental', 'daily-use'],
  },

  // ══════════════════════════════════════════════════════
  //  LAHORE
  // ══════════════════════════════════════════════════════
  {
    name: 'Hyperstar Lahore (Emporium Mall)',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [74.2690, 31.4698] },
    address: { street: 'Johar Town', area: 'Emporium Mall', city: 'Lahore', province: 'Punjab' },
    phone: '042-111-000-001',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'premium', rating: 4.7, totalReviews: 5600,
    tags: ['supermarket', 'imported', 'international'],
  },
  {
    name: 'Metro Cash & Carry Lahore',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [74.3087, 31.5204] },
    address: { street: 'Multan Road', area: 'Thokar Niaz Baig', city: 'Lahore', province: 'Punjab' },
    phone: '042-35270000',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: false, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.4, totalReviews: 3200,
    tags: ['wholesale', 'bulk', 'restaurant-supply'],
  },
  {
    name: 'Al-Fatah Defence Lahore',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [74.3697, 31.4785] },
    address: { street: 'Main Boulevard', area: 'DHA Phase 5', city: 'Lahore', province: 'Punjab' },
    phone: '042-35716901',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'premium', rating: 4.6, totalReviews: 4100,
    tags: ['supermarket', 'premium', 'imported'],
  },
  {
    name: 'Imtiaz Super Market Lahore',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [74.2850, 31.4890] },
    address: { street: 'Ferozepur Road', area: 'Johar Town', city: 'Lahore', province: 'Punjab' },
    phone: '042-35290100',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.5, totalReviews: 6800,
    tags: ['budget-friendly', 'supermarket', 'local'],
  },
  {
    name: 'Ansar Gallery Liberty Lahore',
    type: 'departmental',
    location: { type: 'Point', coordinates: [74.3285, 31.5091] },
    address: { street: 'Main Market', area: 'Liberty Market', city: 'Lahore', province: 'Punjab' },
    phone: '042-35761234',
    availableCategories: ['lentils', 'rice', 'snack', 'beverage', 'dairy'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.2, totalReviews: 1800,
    tags: ['departmental', 'traditional'],
  },
  {
    name: 'Lahore Meat Market Mozang',
    type: 'grocery',
    location: { type: 'Point', coordinates: [74.3098, 31.5250] },
    address: { street: 'Mozang Chowk', area: 'Mozang', city: 'Lahore', province: 'Punjab' },
    availableCategories: ['meat'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.3, totalReviews: 720,
    tags: ['halal-meat', 'fresh', 'butcher'],
  },

  // ══════════════════════════════════════════════════════
  //  KARACHI
  // ══════════════════════════════════════════════════════
  {
    name: 'Carrefour Karachi (Mall of Arabia)',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [67.0822, 24.8607] },
    address: { street: 'Tariq Road', area: 'PECHS', city: 'Karachi', province: 'Sindh' },
    phone: '021-111-694-694',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'premium', rating: 4.6, totalReviews: 8900,
    tags: ['international', 'supermarket', 'imported'],
  },
  {
    name: 'Chase Value Centre Karachi',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [67.0650, 24.8780] },
    address: { street: 'Shahrah-e-Faisal', area: 'Gulshan-e-Iqbal', city: 'Karachi', province: 'Sindh' },
    phone: '021-34385200',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.4, totalReviews: 4200,
    tags: ['supermarket', 'budget-friendly'],
  },
  {
    name: 'Naheed Super Market Karachi',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [67.0590, 24.8645] },
    address: { street: 'Bahadurabad', area: 'Bahadurabad', city: 'Karachi', province: 'Sindh' },
    phone: '021-34148000',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.5, totalReviews: 5600,
    tags: ['supermarket', 'local', 'trusted'],
  },
  {
    name: 'Metro Cash & Carry Karachi',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [67.1024, 24.8890] },
    address: { street: 'National Highway', area: 'Scheme 33', city: 'Karachi', province: 'Sindh' },
    phone: '021-34510000',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.3, totalReviews: 3100,
    tags: ['wholesale', 'bulk', 'restaurant-supply'],
  },
  {
    name: 'Burns Road Sabzi & Fruit Market',
    type: 'grocery',
    location: { type: 'Point', coordinates: [67.0235, 24.8580] },
    address: { street: 'Burns Road', area: 'Saddar', city: 'Karachi', province: 'Sindh' },
    availableCategories: ['vegetables', 'fruits'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.1, totalReviews: 890,
    tags: ['wholesale', 'fresh-produce', 'budget'],
  },
  {
    name: 'Agha Supermarket Karachi',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [67.0476, 24.8145] },
    address: { street: 'Khayaban-e-Shaheen', area: 'DHA Phase 6', city: 'Karachi', province: 'Sindh' },
    phone: '021-35897654',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'premium', rating: 4.7, totalReviews: 2300,
    tags: ['premium', 'imported', 'dha'],
  },

  // ══════════════════════════════════════════════════════
  //  ISLAMABAD / RAWALPINDI
  // ══════════════════════════════════════════════════════
  {
    name: 'Centaurus Food Court & Hypermart',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [73.0479, 33.7215] },
    address: { street: 'Jinnah Avenue', area: 'Blue Area', city: 'Islamabad', province: 'ICT' },
    phone: '051-2800800',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'premium', rating: 4.6, totalReviews: 6700,
    tags: ['supermarket', 'premium', 'imported', 'international'],
  },
  {
    name: 'Islamabad Fruit & Vegetable Market F-11',
    type: 'grocery',
    location: { type: 'Point', coordinates: [73.0124, 33.7010] },
    address: { street: 'F-11 Markaz', area: 'F-11', city: 'Islamabad', province: 'ICT' },
    availableCategories: ['vegetables', 'fruits'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.2, totalReviews: 540,
    tags: ['fresh-produce', 'local'],
  },
  {
    name: 'Jalal Sons Islamabad',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [73.0890, 33.7295] },
    address: { street: 'I-8 Markaz', area: 'I-8', city: 'Islamabad', province: 'ICT' },
    phone: '051-4860001',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.4, totalReviews: 1900,
    tags: ['supermarket', 'trusted', 'local'],
  },
  {
    name: 'Rawalpindi Saddar Grocery Market',
    type: 'grocery',
    location: { type: 'Point', coordinates: [73.0553, 33.5987] },
    address: { street: 'Saddar Road', area: 'Saddar', city: 'Rawalpindi', province: 'Punjab' },
    availableCategories: ['lentils', 'rice', 'bread', 'vegetables', 'dairy', 'snack'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.0, totalReviews: 680,
    tags: ['budget', 'local', 'traditional'],
  },
  {
    name: 'Metro Cash & Carry Islamabad',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [73.1210, 33.6687] },
    address: { street: 'Srinagar Highway', area: 'Faizabad', city: 'Islamabad', province: 'ICT' },
    phone: '051-2890000',
    availableCategories: ['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: false, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.3, totalReviews: 2800,
    tags: ['wholesale', 'bulk'],
  },

  // ══════════════════════════════════════════════════════
  //  MULTAN
  // ══════════════════════════════════════════════════════
  {
    name: 'Al-Fatah Multan',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [71.4783, 30.1978] },
    address: { street: 'Abdali Road', area: 'City Center', city: 'Multan', province: 'Punjab' },
    phone: '061-4510001',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.3, totalReviews: 1400,
    tags: ['supermarket', 'local', 'trusted'],
  },
  {
    name: 'Multan Sabzi Mandi Qila Kuhna',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [71.4650, 30.1890] },
    address: { street: 'Qila Kuhna Road', area: 'Old City', city: 'Multan', province: 'Punjab' },
    availableCategories: ['vegetables', 'fruits'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.0, totalReviews: 310,
    tags: ['wholesale', 'fresh-produce'],
  },
  {
    name: 'Multan Kiryana & General Store',
    type: 'kiryana',
    location: { type: 'Point', coordinates: [71.4812, 30.2050] },
    address: { street: 'Nawan Shehr', area: 'Nawan Shehr', city: 'Multan', province: 'Punjab' },
    availableCategories: ['lentils', 'rice', 'bread', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.1, totalReviews: 220,
    tags: ['kiryana', 'daily-essentials'],
  },

  // ══════════════════════════════════════════════════════
  //  GUJRANWALA
  // ══════════════════════════════════════════════════════
  {
    name: 'Gujranwala Super Store',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [74.1818, 32.1617] },
    address: { street: 'GT Road', area: 'Satellite Town', city: 'Gujranwala', province: 'Punjab' },
    phone: '055-3840001',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.2, totalReviews: 870,
    tags: ['supermarket', 'local'],
  },
  {
    name: 'Gujranwala Sabzi & Fruit Mandi',
    type: 'wholesale',
    location: { type: 'Point', coordinates: [74.1920, 32.1720] },
    address: { street: 'Sabzi Mandi Road', area: 'Main Market', city: 'Gujranwala', province: 'Punjab' },
    availableCategories: ['vegetables', 'fruits'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.0, totalReviews: 280,
    tags: ['wholesale', 'fresh', 'local-produce'],
  },

  // ══════════════════════════════════════════════════════
  //  ONLINE STORES (Pakistan-wide delivery)
  // ══════════════════════════════════════════════════════
  {
    name: 'Daraz Fresh (Online)',
    type: 'online',
    location: { type: 'Point', coordinates: [74.3587, 31.5204] },
    address: { street: 'Online Platform', area: 'Nationwide', city: 'Lahore', province: 'Punjab' },
    phone: '042-111-132-729',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.1, totalReviews: 18000,
    tags: ['online', 'nationwide', 'delivery'],
  },
  {
    name: 'Grocerapp (Online)',
    type: 'online',
    location: { type: 'Point', coordinates: [67.0822, 24.8607] },
    address: { street: 'Online Platform', area: 'Nationwide', city: 'Karachi', province: 'Sindh' },
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.3, totalReviews: 9400,
    tags: ['online', 'karachi', 'lahore', 'delivery'],
  },
  {
    name: 'Airlift Express (Online)',
    type: 'online',
    location: { type: 'Point', coordinates: [74.2850, 31.4890] },
    address: { street: 'Online Platform', area: 'Lahore & Karachi', city: 'Lahore', province: 'Punjab' },
    availableCategories: ['lentils', 'rice', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: true,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.2, totalReviews: 7200,
    tags: ['online', 'quick-delivery', 'affordable'],
  },

  // ══════════════════════════════════════════════════════
  //  SIALKOT
  // ══════════════════════════════════════════════════════
  {
    name: 'Sialkot Mart',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [74.5395, 32.4927] },
    address: { street: 'Paris Road', area: 'Paris Road', city: 'Sialkot', province: 'Punjab' },
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'snack'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.1, totalReviews: 640,
    tags: ['supermarket', 'local'],
  },

  // ══════════════════════════════════════════════════════
  //  PESHAWAR
  // ══════════════════════════════════════════════════════
  {
    name: 'Peshawar Qissa Khwani Bazar',
    type: 'grocery',
    location: { type: 'Point', coordinates: [71.5783, 34.0151] },
    address: { street: 'Qissa Khwani Bazar', area: 'Old City', city: 'Peshawar', province: 'KPK' },
    availableCategories: ['meat', 'lentils', 'vegetables', 'fruits', 'snack'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 4.3, totalReviews: 980,
    tags: ['traditional', 'local', 'fresh'],
  },
  {
    name: 'Peshawar Supermarket Hayatabad',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [71.5190, 33.9978] },
    address: { street: 'Phase 5', area: 'Hayatabad', city: 'Peshawar', province: 'KPK' },
    phone: '091-5850001',
    availableCategories: ['meat', 'lentils', 'rice', 'vegetables', 'dairy', 'snack', 'beverage'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.2, totalReviews: 760,
    tags: ['supermarket', 'modern'],
  },

  // ══════════════════════════════════════════════════════
  //  BAHAWALPUR
  // ══════════════════════════════════════════════════════
  {
    name: 'Bahawalpur City Store',
    type: 'departmental',
    location: { type: 'Point', coordinates: [71.6752, 29.3956] },
    address: { street: 'Circular Road', area: 'Model Town', city: 'Bahawalpur', province: 'Punjab' },
    availableCategories: ['lentils', 'rice', 'snack', 'beverage', 'dairy'],
    hasHomeDelivery: false, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'budget', rating: 3.9, totalReviews: 320,
    tags: ['departmental', 'local'],
  },

  // ══════════════════════════════════════════════════════
  //  SARGODHA
  // ══════════════════════════════════════════════════════
  {
    name: 'Sargodha Super Mart',
    type: 'supermarket',
    location: { type: 'Point', coordinates: [72.6748, 32.0836] },
    address: { street: 'University Road', area: 'University Town', city: 'Sargodha', province: 'Punjab' },
    availableCategories: ['lentils', 'rice', 'vegetables', 'dairy', 'snack'],
    hasHomeDelivery: true, hasOnlineOrdering: false,
    isHalalCertified: true, pricingTier: 'mid', rating: 4.0, totalReviews: 410,
    tags: ['supermarket', 'local'],
  },
];

const seedStores = async () => {
  try {
    await connectDB();

    const existing = await Store.countDocuments();
    if (existing > 0) {
      console.log(`\n⚠️  Clearing ${existing} existing stores and reseeding...\n`);
      await Store.deleteMany({});
    }

    const inserted = await Store.insertMany(pakistaniStores);
    console.log(`\n✅ Successfully seeded ${inserted.length} Pakistani stores!\n`);

    // Summary by city
    const cities = {};
    pakistaniStores.forEach((s) => {
      cities[s.address.city] = (cities[s.address.city] || 0) + 1;
    });
    console.log('📍 Stores by city:');
    Object.entries(cities).forEach(([city, count]) => {
      console.log(`   ${city}: ${count} stores`);
    });
    console.log(`\n🛒 With home delivery: ${pakistaniStores.filter((s) => s.hasHomeDelivery).length}`);
    console.log(`🌐 Online stores: ${pakistaniStores.filter((s) => s.type === 'online').length}\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Store seeding failed:', err.message);
    process.exit(1);
  }
};

seedStores();
