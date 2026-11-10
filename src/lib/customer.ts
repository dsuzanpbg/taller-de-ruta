export const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de Mexico",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de Mexico",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacan",
  "Morelos",
  "Nayarit",
  "Nuevo Leon",
  "Oaxaca",
  "Puebla",
  "Queretaro",
  "Quintana Roo",
  "San Luis Potosi",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatan",
  "Zacatecas",
] as const;

export type Customer = {
  name: string;
  email: string;
  phone: string;
  street: string;
  interior: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

export type FieldErrors = Partial<Record<keyof Customer, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[0-9+\s()-]{10,20}$/;
const ZIP_RE = /^[0-9]{5}$/;

export const emptyCustomer: Customer = {
  name: "",
  email: "",
  phone: "",
  street: "",
  interior: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
};

export function validateCustomer(input: unknown): {
  customer: Customer;
  errors: FieldErrors;
} {
  const source = (input ?? {}) as Record<string, unknown>;

  const read = (key: keyof Customer, max = 120): string =>
    typeof source[key] === "string" ? (source[key] as string).trim().slice(0, max) : "";

  const customer: Customer = {
    name: read("name", 80),
    email: read("email", 120).toLowerCase(),
    phone: read("phone", 20),
    street: read("street", 120),
    interior: read("interior", 40),
    neighborhood: read("neighborhood", 80),
    city: read("city", 80),
    state: read("state", 60),
    zip: read("zip", 5),
    notes: read("notes", 400),
  };

  const errors: FieldErrors = {};

  if (customer.name.length < 3) {
    errors.name = "Escribe tu nombre completo.";
  }
  if (!EMAIL_RE.test(customer.email)) {
    errors.email = "Escribe un correo valido, ahi te enviamos el seguimiento.";
  }
  if (!PHONE_RE.test(customer.phone) || customer.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Escribe un telefono de 10 digitos.";
  }
  if (customer.street.length < 5) {
    errors.street = "Escribe tu calle y numero.";
  }
  if (customer.neighborhood.length < 2) {
    errors.neighborhood = "Escribe tu colonia.";
  }
  if (customer.city.length < 2) {
    errors.city = "Escribe tu ciudad o municipio.";
  }
  if (!(MEXICAN_STATES as readonly string[]).includes(customer.state)) {
    errors.state = "Selecciona tu estado.";
  }
  if (!ZIP_RE.test(customer.zip)) {
    errors.zip = "El codigo postal debe tener 5 digitos.";
  }

  return { customer, errors };
}
