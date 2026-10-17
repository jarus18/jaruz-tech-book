export default function SetupNeeded() {
  return (
    <div className="container main">
      <div className="auth-box">
        <h1>Sozlash kerak</h1>
        <p>
          Dastur Supabase'ga ulanmagan. Loyiha papkasida <code>.env</code> fayl yarating va
          <code> .env.example</code> dagi ikki qiymatni o'z Supabase loyihangizdan to'ldiring.
          Batafsil yo'riqnoma <code>README.md</code> faylida.
        </p>
      </div>
    </div>
  )
}
