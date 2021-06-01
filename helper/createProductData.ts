export default (product, opts: Record<string, any> = {}) => {
  return {
    sku: product.sku,
    productId: product.sku,
    variantIds: [product.sku],
    price: product.price,
    quantity: product.qty || opts.qty,
    discounted: !!opts.coupon_code,
    displayName: product.name
  }
}
