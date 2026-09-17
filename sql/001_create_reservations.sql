CREATE TABLE reservations (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_name text NOT NULL,
    reservation_date date NOT NULL,
    people_amount integer NOT NULL,

    CONSTRAINT reservations_client_name_not_blank
        CHECK (length(btrim(client_name)) > 0),

    CONSTRAINT reservations_people_amount_positive
        CHECK (people_amount > 0)
);