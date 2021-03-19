// import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

// @ValidatorConstraint({ name: 'customText', async: false })
// export class CustomTextLength implements ValidatorConstraintInterface {
//   validate(anObject: any[], args: ValidationArguments) {
//     return anObject typeof args.value;
//     // for async validations you must return a Promise<boolean> here
//   }

//   defaultMessage(args: ValidationArguments) {
//     // here you can provide default error message if validation failed
//     return 'Text ($value) is too short or too long!';
//   }
// }