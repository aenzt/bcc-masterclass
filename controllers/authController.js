import User from '../models/User.js'
import Jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return Jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge
  });
};

const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}

export async function login(req, res) {

	const { email, password } = req.body;

    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
      } 
      catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ err });
      }
}

export async function register(req, res) {
    let roles = 0
    if (req.body.roles){
         roles  = req.body.roles;
    };
    const { email, password, fullName } = req.body;
    try{
        const user = await User.create({ email, password, fullName, roles });
        const token = createToken(user._id);
        res.cookie('jwt', token, {httpOnly: true, maxAge: maxAge * 1000 })
        res.status(201).json({user: user._id, fullName: user.fullName})
    }
    catch(err){
        res.status(400).json({err})
    }
}

export function logout(req, res) {
    res.clearCookie("jwt");
    return res.json({
        message: "Logout success"
    })
}

export async function view(req, res) {
	const user = await User.findOne({"_id": res.locals.user});
	return res.json({
		message: "Your Account",
		email: user.email,
    fullName: user.fullName,
    balance: user.balance,
	});
}

export async function addbalance(req, res){
  const balance = Number(req.body.balance);

	const user = await User.findOne({"_id": res.locals.user});
  user.balance = user.balance + balance;
  await user.save();
  return res.json({
    message: "Your Balance",
    balance: user.balance
  });
}