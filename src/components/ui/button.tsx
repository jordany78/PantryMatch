import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-pantry-green px-4 py-2 text-white ${
        props.className ?? ""
      }`}
    />
  );
}
