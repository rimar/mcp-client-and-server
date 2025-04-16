import TanchatHeader from "../integrations/tanchat/header-user";

export default function Header() {
  return (
    <header className="absolute top-[30px] right-[490px]">
        <TanchatHeader />
    </header>
  );
}
