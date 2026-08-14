import { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-md border border-gray-300 px-3 py-2 ${
        props.className ?? ""
      }`}
    />
  );
}
