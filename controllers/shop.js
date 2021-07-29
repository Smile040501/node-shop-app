const fs = require("fs");
const path = require("path");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PDFDocument = require("pdfkit");

const Product = require("../models/product.js");
const Order = require("../models/order.js");

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems = 0;

    Product.find()
        .countDocuments()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE) // skip these many items
                .limit(ITEMS_PER_PAGE); // limit on how many items to fetch
        })
        .then((products) => {
            res.render("shop/index", {
                prods: products,
                pageTitle: "Shop",
                path: "/",
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems = 0;

    Product.find()
        .countDocuments()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE) // skip these many items
                .limit(ITEMS_PER_PAGE); // limit on how many items to fetch
        })
        .then((products) => {
            res.render("shop/productList", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
        .then((product) => {
            console.log(product);
            res.render("shop/productDetail", {
                product: product,
                pageTitle: product.title,
                path: "/products",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
            const products = user.cart.items;
            res.render("shop/cart", {
                pageTitle: "Your Cart",
                path: "/cart",
                products: products,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const { productId } = req.body;
    Product.findById(productId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then((result) => {
            console.log(result);
            res.redirect("/cart");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const { productId } = req.body;
    req.user
        .removeFromCart(productId)
        .then((result) => {
            res.redirect("/cart");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
            products = user.cart.items;
            total = 0;
            products.forEach((p) => {
                total += p.quantity * p.productId.price;
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: products.map((p) => {
                    return {
                        name: p.productId.title,
                        description: p.productId.description,
                        amount: p.productId.price * 100,
                        currency: "inr",
                        quantity: p.quantity,
                    };
                }),
                success_url: `${req.protocol}://${req.get(
                    "host"
                )}/checkout/success`, // => https://localhost:3000/checkout/success
                cancel_url: `${req.protocol}://${req.get(
                    "host"
                )}/checkout/cancel`,
            });
        })
        .then((session) => {
            res.render("shop/checkout", {
                pageTitle: "Checkout",
                path: "/checkout",
                products: products,
                totalSum: total,
                sessionId: session.id,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
            const products = user.cart.items.map((i) => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc },
                };
                // _doc gets the data that is in there
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
                products,
            });
            return order.save();
        })
        .then((result) => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect("/orders");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
            const products = user.cart.items.map((i) => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc },
                };
                // _doc gets the data that is in there
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
                products,
            });
            return order.save();
        })
        .then((result) => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect("/orders");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ "user.userId": req.user._id })
        .then((orders) => {
            res.render("shop/orders", {
                pageTitle: "Your Orders",
                path: "/orders",
                orders: orders,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(new Error("No order found."));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error("Unauthorized"));
            }
            const invoiceName = "invoice-" + orderId + ".pdf";
            const invoicePath = path.join("data", "invoices", invoiceName);

            // fs.readFile(invoicePath, (err, data) => {    // Takes time for long files
            //     if (err) {
            //         return next(err);
            //     }
            //     res.setHeader("Content-Type", "application/pdf");
            //     res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);
            //     res.send(data);
            // });

            // const file = fs.createReadStream(invoicePath); // streaming response data
            // res.setHeader("Content-Type", "application/pdf");
            // res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`);
            // file.pipe(res); // forward data that is read in with that stream to response because response object is writable stream
            // We can use readable streams to pipe() their output to writable streams
            // Data will be downloaded by browser step by step

            const pdfDoc = new PDFDocument();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `inline; filename=${invoiceName}`
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text("Invoice", {
                underline: true,
            });
            pdfDoc.text("-------------------------");
            let totalPrice = 0;
            order.products.forEach((prod) => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc
                    .fontSize(14)
                    .text(
                        prod.product.title +
                            " - " +
                            prod.quantity +
                            " x " +
                            "$" +
                            prod.product.price
                    );
            });
            pdfDoc.text("----");
            pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

            pdfDoc.end();
        })
        .catch((err) => next(err));
};
