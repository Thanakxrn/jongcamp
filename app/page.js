<<<<<<< HEAD
=======
import Image from "next/image";
import styles from "./page.module.css";
>>>>>>> 975ab91 (feat: add dashboard, auto-checkout, double-booking guard, manual checkout)
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/campsites');
}
