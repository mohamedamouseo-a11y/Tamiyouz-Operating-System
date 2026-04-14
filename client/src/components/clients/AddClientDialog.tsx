import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { CLIENT_SERVICES } from "@/lib/clientOptions";
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Required"),
  nameAr: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  industry: z.string().min(1, "Required"),
  isActive: z.boolean().default(true),
  services: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const createClient = trpc.clients.create.useMutation({
    onSuccess: async () => {
      await utils.clients.list.invalidate();
      toast.success("Client created");
      setOpen(false);
      form.reset({
        name: "",
        nameAr: "",
        contactEmail: "",
        contactPhone: "",
        industry: "",
        isActive: true,
        services: [],
      });
    },
    onError: (error) => toast.error(error.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nameAr: "",
      contactEmail: "",
      contactPhone: "",
      industry: "",
      isActive: true,
      services: [],
    },
  });

  const selectedServices = form.watch("services");

  const toggleService = (service: string, checked: boolean) => {
    const current = form.getValues("services");
    form.setValue(
      "services",
      checked ? [...current, service] : current.filter((item) => item !== service),
      { shouldValidate: true },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Client</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Client</DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => {
            createClient.mutate({
              ...values,
              contactEmail: values.contactEmail || null,
              nameAr: values.nameAr || null,
            });
          })}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nameAr">Arabic Name</Label>
              <Input id="nameAr" {...form.register("nameAr")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" {...form.register("industry")} />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input id="contactEmail" {...form.register("contactEmail")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input id="contactPhone" {...form.register("contactPhone")} />
            </div>
          </div>

          <div className="grid gap-3">
            <Label>Services</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {CLIENT_SERVICES.map((service) => (
                <label key={service} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                  <Checkbox
                    checked={selectedServices.includes(service)}
                    onCheckedChange={(checked) => toggleService(service, checked === true)}
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked === true)}
            />
            Active client
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
