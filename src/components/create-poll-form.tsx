"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useFormState, useFormStatus } from "react-dom";
import { createPoll } from "@/lib/actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { set } from "zod/v3";
import { useRouter } from "next/navigation";

// Define the form schema with Zod for validation.
export const pollFormSchema = z.object({
  question: z.string().min(1, { message: "Question is required" }),
  options: z
    .array(z.string().min(1, { message: "Option is required" }))
    .min(2, { message: "At least two options are required" }),
});

const initialState = {
  message: "",
  validate: true,
};

export function CreatePollForm() {
  const router = useRouter();
  const { pending } = useFormStatus();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof pollFormSchema>>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: "",
      options: ["", ""],
    },
  });

  const onsubmit = async (values: z.infer<typeof pollFormSchema>) => {
    console.log({ values });
    setLoading(true);
    const result = await createPoll({}, values);
    if (result.validate) {
      toast.success("Poll created successfully!");
      router.push("/polls");
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onsubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Input placeholder="What is your favorite color?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch("options").map((_, index) => (
          <FormField
            key={index}
            control={form.control}
            name={`options.${index}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option {index + 1}</FormLabel>
                <FormControl>
                  <Input placeholder={`Option ${index + 1}`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button
          type="button"
          onClick={() =>
            form.setValue("options", [...form.getValues("options"), ""])
          }
        >
          Add Option
        </Button>
        {/*<FormMessage>{state.validate && state.message}</FormMessage>*/}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating poll..." : "Create Poll"}
        </Button>
      </form>
    </Form>
  );
}
