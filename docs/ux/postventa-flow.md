# Postventa Flow

## Base navigation

Order
-> Full page extension
-> Product selection
-> Continue
-> Flow-specific step sequence
-> Review
-> Create request

## Step sequences

- return: products -> reason -> resolution -> logistics -> review
- withdrawal: products -> resolution -> logistics -> review
- missing: products -> resolution -> review
- sizeExchange: products -> size -> logistics -> review

## UX quality bars

- Clear loading, empty, and error states.
- Back/forward resilient navigation.
- Prevent double submit.
- Accessible labels, focus order, and feedback.
