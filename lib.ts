export const decimal = (num: ethers.BigNumber, dec: number) =>
  Number(num.toString()) / Math.pow(10, dec)

export const parseItem = ([owner, title, description, price, token, amount, endPaymentDate, uri]) => ({
  owner,
  title,
  description,
  price,
  token,
  amount,
  endPaymentDate: new Date(Number(endPaymentDate) * 1000),
  uri,
})
