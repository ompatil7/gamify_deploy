//atom is basically a state
//we will use recoil here state management library by facebook
//each atom will be one state
//it will determine if we are in login or signup

import { atom } from "recoil";

const authScreenAtom = atom({
  key: "authScreenAtom", //key is required by reocil to differentiate beetween which atom is which
  default: "login",
});

export default authScreenAtom;
