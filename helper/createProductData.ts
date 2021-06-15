export default (product, opts: Record<string, any> = {}) => {
  return {
    id: product.sku,
    variantIds: [product.sku],
    price: (parseFloat(product.price || 0) * 100),
    quantity: product.qty || opts.qty,
    discounted: !!opts.coupon_code,
    displayName: product.name
  }
}
