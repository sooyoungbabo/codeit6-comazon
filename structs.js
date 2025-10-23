import * as s from 'superstruct';
import isEmail from 'is-email';

export const CreateUser = s.object({
  email: s.define('Email', isEmail),
  firstName: s.size(s.string(), 1, 30),
  lastName: s.size(s.string(), 1, 30),
  address: s.string(),
  userPreference: s.object({ receiveEmail: s.boolean() }),
});

export const PatchUser = s.partial(CreateUser);

const CATEGORIES = [
  'FASHION',
  'BEAUTY',
  'HEALTH',
  'SPORTS',
  'ELECTRONICS',
  'HOME_INTERIOR',
  'OFFICE',
  'KITCHENWARE',
  'HOUSEHOLD_SUPPLIES',
];

export const CreateProduct = s.object({
  name: s.size(s.string(), 1, 60),
  description: s.string(),
  category: s.enums(CATEGORIES),
  price: s.min(s.number(), 0),
  stock: s.min(s.integer(), 0),
});

export const PatchProduct = s.partial(CreateProduct);
