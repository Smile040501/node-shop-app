const stripe = Stripe("STRIPE_PUBLISHABLE_KEY");

const orderBtn = document.getElementById("order-btn");

orderBtn.addEventListener("click", function () {
    console.log(orderBtn.dataset);

    stripe.redirectToCheckout({
        sessionId: orderBtn.dataset.sessionId,
    });
});
