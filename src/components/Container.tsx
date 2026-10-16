export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div style={{ width: "90%", margin: "0 auto" }} className={className}>
      {children}
    </div>
  );
}
