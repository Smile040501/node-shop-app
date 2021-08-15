const stripe = Stripe(
    "pk_test_51Ik5l2SBOpMCQeDMwgCGCjMieScQVDDLoHk9e8rgaC3TxCNsXpHEWMR0QQv4LlnyJFJdKyWOshkE3H8i3B5AhUSe00lYKFDrJ0"
);

const orderBtn = document.getElementById("order-btn");

orderBtn.addEventListener("click", function () {
    console.log(orderBtn.dataset);

    stripe.redirectToCheckout({
        sessionId: orderBtn.dataset.sessionId,
    });
});
