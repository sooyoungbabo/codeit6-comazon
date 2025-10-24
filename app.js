import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { assert } from 'superstruct';
import cors from 'cors';
import {
  CreateOrder,
  CreateProduct,
  CreateUser,
  PatchOrder,
  PatchProduct,
  PatchUser,
  SaveProduct
} from './structs.js';
import e from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PORT } from './constants.js';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      console.error(e);
      if (e instanceof PrismaClientKnownRequestError) {
        switch (e.code) {
          case 'P2025':
            res.status(404).send('Not found');
            break;
          case 'P2002':
            res.status(400).send('Unique constraint failed');
            break;
          default:
            res.status(500).send(e.message);
        }
      }
      if (e.name === 'StructError') {
        res.status(400).send(e.message);
      }
    }
  };
}

//----------------------------- rout hander: users
app.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 0, order = 'newest' } = req.query;
    let orderBy;
    switch (order) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const users = await prisma.user.findMany({
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit) || undefined,
      include: { userPreference: true }
    });
    res.status(200).send(users);
  })
);

app.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: { userPreference: true, savedItems: true }
    });
    res.send(user);
  })
);

app.post(
  '/users',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateUser);

    const { userPreference, ...userFields } = req.body;
    const email = req.body.email;

    // if (await prisma.user.count({ where: { email } })) {
    //   res.send('Same email exists.');
    //   throw new Error('Same email exists.');
    // }

    const user = await prisma.user.create({
      data: {
        ...userFields,
        userPreference: { create: userPreference }
      },
      include: { userPreference: true }
    });
    res.status(201).send(user);
  })
);

app.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    assert(req.body, PatchUser);
    const { userPreference, ...userFields } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userFields,
        userPreference: { update: userPreference }
      },
      include: { userPreference: true }
    });
    res.send(user);
  })
);

app.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.delete({ where: { id } });

    res.send(user);
    console.log('User deleted.');
  })
);

app.post(
  '/users/:id/save',
  asyncHandler(async (req, res) => {
    assert(req.body, SaveProduct);
    const { id: userId } = req.params;
    const { productId } = req.body;
    const data = await prisma.user.update({
      where: { id: userId },
      data: {
        savedItems: { connect: { id: productId } }
      },
      include: { savedItems: true }
    });
    res.status(201).send(data);
  })
);

//----------------------------- rout hander: products
app.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 0, order = 'newest', category } = req.query;
    let orderBy;
    switch (order) {
      case 'priceLowest':
        orderBy = { price: 'asc' };
        break;
      case 'priceHighest':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const where = category ? { category } : { category: {} };
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit) || undefined
    });
    res.send(products);
  })
);

app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await prisma.product.findFirstOrThrow({
      where: { id },
      include: { savedUsers: true }
    });
    res.send(product);
  })
);

app.post(
  '/products',
  asyncHandler(async (req, res) => {
    const data = req.body;
    assert(data, CreateProduct);
    const product = await prisma.product.create({ data });
    res.send(product);
  })
);

app.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    assert(data, PatchProduct);
    const product = await prisma.product.update({ where: { id }, data });
    res.send(product);
  })
);

app.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await prisma.product.delete({ where: { id } });
    console.log('Product deleted.');
    res.send(product);
  })
);

//----------------------------- rout hander: orders
app.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 0, order = 'newest' } = req.query;
    let orderBy;
    switch (order) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const orders = await prisma.order.findMany({
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit) || undefined,
      include: { orderItems: true }
    });
    res.send(orders);
  })
);

app.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: { orderItems: { include: { product: true } } }
    });
    let total = 0; // calcumate the total price
    order.orderItems.forEach((orderItem) => {
      total += orderItem.unitPrice * orderItem.quantity;
    });
    order.total = total;
    res.send(order);
  })
);

app.post(
  '/orders',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateOrder);

    const { orderItems, ...orderProperties } = req.body;

    // from orderItems array, extract productIds & associated quatity
    const productIds = orderItems.map((orderItem) => orderItem.productId);

    function getQuantity(productId) {
      const orderItem = orderItems.find((orderItem) => orderItem.productId === productId);
      return orderItem.quantity;
    }

    // check if there is enough stock )
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const isSufficientStock = products.every((product) => {
      const { id, stock } = product;
      return stock >= getQuantity(id);
    });
    // cancel the order if there is any item with insufficient stock
    if (!isSufficientStock) {
      return res.status(500).send('Insufficient stock');
    }

    // update quantity: reduce stodck by order
    const queries = productIds.map((id) => {
      return prisma.product.update({
        where: { id },
        data: { stock: { decrement: getQuantity(id) } }
      });
    });

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          // user: {
          //   connect: { id: orderProperties.userId }
          // },
          ...orderProperties,
          orderItems: { create: orderItems }
        },
        include: { orderItems: true }
      }),
      ...queries
    ]);

    res.send(order);
  })
);

app.patch(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    assert(req.body, PatchOrder);
    const { id } = req.params;
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { orderItems: true }
    });
    res.send(order);
  })
);

app.delete(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.delete({ where: { id } });
    console.log('Order deleted.');
    res.send(order);
  })
);

app.listen(PORT || 3000, () => console.log(`Server started`));
