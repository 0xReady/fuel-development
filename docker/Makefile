services-run:
	docker compose --env-file ./.env -p escrow_local up --build -d

services-clean:
	docker compose -p escrow_local down --rmi local -v --remove-orphans

