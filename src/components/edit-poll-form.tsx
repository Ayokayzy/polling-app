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
} from "@/components/ui/form";
import { useFormState, useFormStatus } from "react-dom";
import { updatePoll } from "@/lib/actions";
import { useEffect } from "react";
import { toast } from "sonner";
import { Poll } from "@prisma/client";

// Define the form schema with Zod for validation.
const formSchema = z.object({
  question: z.string().min(1, { message: "Question is required" }),
  options: z
    .array(z.string().min(1, { message: "Option is required" }))
    .min(2, { message: "At least two options are required" }),
});

const initialState = {
  message: "",
  validate: true,
};

export function EditPollForm({ poll }: { poll: Poll }) {
  const [state, formAction] = useFormState(
    updatePoll.bind(null, poll.id),
    initialState,
  );
  const { pending } = useFormStatus();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: poll.question,
      options: poll.options as string[],
    },
  });

  useEffect(() => {
    if (!state.validate) {
      toast.error(state.message);
    } else if (state.message) {
      form.setError("root", {
        type: "manual",
        message: state.message,
      });
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="flex flex-col gap-4">
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
        <FormMessage>{state.validate && state.message}</FormMessage>
        <Button type="submit" disabled={pending}>
          {pending ? "Updating poll..." : "Update Poll"}
        </Button>
      </form>
    </Form>
  );
}
